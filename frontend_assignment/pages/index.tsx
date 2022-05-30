import detectEthereumProvider from "@metamask/detect-provider"
import Greeter from "artifacts/contracts/Greeters.sol/Greeters.json";
import { Strategy, ZkIdentity } from "@zk-kit/identity"
import { generateMerkleProof, Semaphore } from "@zk-kit/protocols"
import { providers, Contract, utils } from "ethers"
import Head from "next/head"
import React from "react"
import styles from "../styles/Home.module.css"
import Form from "./Form";
import {Typography,Button,Container,Card, CardActions,CardContent} from "@mui/material";

export default function Home() {
    const [logs, setLogs] = React.useState("Connect your wallet and greet!")
    const [greetingMessage, setGreetingMessage] = React.useState('');

    React.useEffect(() => {
        const greetingListener = async () => {
        const prv = new providers.JsonRpcProvider("http://localhost:8545")
        const greetingContract = new Contract(
            '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
            Greeter.abi,
            prv
        )
        greetingContract.on('NewGreeting', (greeting:string) => {
              console.log('greeting>>>>>>>>>>>')
              setGreetingMessage(utils.parseBytes32String(greeting))
        })
        }
        greetingListener()
      }, [])

    async function greet() {
        setLogs("Creating your Semaphore identity...")

        const provider = (await detectEthereumProvider()) as any

        await provider.request({ method: "eth_requestAccounts" })

        const ethersProvider = new providers.Web3Provider(provider)
        const signer = ethersProvider.getSigner()
        const message = await signer.signMessage("Sign this message to create your identity!")

        const identity = new ZkIdentity(Strategy.MESSAGE, message)
        const identityCommitment = identity.genIdentityCommitment()
        const identityCommitments = await (await fetch("./identityCommitments.json")).json()

        const merkleProof = generateMerkleProof(20, BigInt(0), identityCommitments, identityCommitment)

        setLogs("Creating your Semaphore proof...")

        const greeting = "Hello world"

        const witness = Semaphore.genWitness(
            identity.getTrapdoor(),
            identity.getNullifier(),
            merkleProof,
            merkleProof.root,
            greeting
        )

        const { proof, publicSignals } = await Semaphore.genProof(witness, "./semaphore.wasm", "./semaphore_final.zkey")
        const solidityProof = Semaphore.packToSolidityProof(proof)

        const response = await fetch("/api/greet", {
            method: "POST",
            body: JSON.stringify({
                greeting,
                nullifierHash: publicSignals.nullifierHash,
                solidityProof: solidityProof
            })
        })

        if (response.status === 500) {
            const errorMessage = await response.text()

            setLogs(errorMessage)
        } else {
            setLogs("Your anonymous greeting is onchain :)")
        }
    }

  return (
    <div>
            <Head>
                <title>Greetings</title>
                <meta name="description" content="A simple Next.js/Hardhat privacy application with Semaphore." />
                <link rel="icon" href="/favicon.ico" />
            </Head>

      <Container component="main" maxWidth="400" sx={{ my: 4 }}>
        <Form onSubmit={(data) => console.log(data)} />
        <Card sx={{ mt: 6, minWidth: 400 }}>
          <CardContent>
            {greetingMessage && (<div>
             <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom >Your Greeting </Typography>
             <Typography>{greetingMessage}</Typography></div>)}
            {!greetingMessage && <Typography>Greet your friends!</Typography>}
          </CardContent>
          {!greetingMessage && (<CardActions><Button size="small" onClick={greet}>Greet</Button></CardActions>)}
        </Card>
      </Container>
    </div>
  );
}

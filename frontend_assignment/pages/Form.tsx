import React from "react";
import { SubmitHandler,useForm  } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import {  string, number, object,date, InferType } from "yup";
import {Button, Paper, Box,TextField } from "@mui/material";

type Inputs = {name: string;age: number;address: string;};

export default function Form({onSubmit,}: {onSubmit: SubmitHandler<Inputs>;}) {
  let schema = object().shape({name: string().required(),age: number().required().positive().integer(),
    address: string().required(),
  });

  const {register,handleSubmit,watch,formState: { errors },
  } = useForm<Inputs>({resolver: yupResolver(schema)});

  return (
    <Paper variant="outlined" sx={{ my: { xs: 3, md: 6 }, p: { xs: 2, md: 3 } }}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          <TextField {...register("name", { required: true })} error={!!errors.name} label={errors.name ? errors.name.message : "Name"}/>
          <TextField {...register("age", { required: true })} type="number" error={!!errors.age} label={errors.age ? errors.age.message : "Age"} sx={{ my: 1 }}/>
          <TextField  {...register("address", { required: true })} error={!!errors.address} label={errors.address ? errors.address.message : "Address"}  sx={{ mb: 3 }} />
          <Button variant="contained" type="submit">Submit</Button>
        </Box>
      </form>
    </Paper>
  );
}

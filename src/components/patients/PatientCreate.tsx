"use client";

import { IPatient } from "../../types";
import {
    Box,
    Card,
    CardContent,
    FormControl,
    FormHelperText,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Typography,
} from "@mui/material";
import Grid from '@mui/material/Grid2';
import { Create } from "@refinedev/mui";
import { useForm } from "@refinedev/react-hook-form";
import React from "react";
import { Controller } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useMedplum } from "../../providers/data-provider/medplum/index";

export const PatientCreate: React.FC = () => {
    const navigate = useNavigate();

    // Use the useForm hook
    const {
        saveButtonProps,
        refineCore: { formLoading, onFinish },
        register,
        control,
        formState: { errors },
        handleSubmit,
    } = useForm<IPatient>({
        refineCoreProps: {
            resource: "patients",
            redirect: "list",
        },
        defaultValues: {
            name: "",
            gender: "unknown",
            birthDate: "",
            phone: "",
            address: "",
            email: "",
            insurance: "",
        },
    });

    // Use Medplum for FHIR integration
    const { medplumClient, isOnline } = useMedplum();

    // Handle form submission with Medplum integration
    const onSubmit = async (data: Record<string, unknown>) => {
        // Convert form data to IPatient
        const patientData: IPatient = {
            name: data.name as string,
            // Only set gender if it's one of the allowed values
            gender: data.gender === "male" || data.gender === "female"
                ? data.gender
                : "unknown",
            birthDate: data.birthDate as string,
            phone: data.phone as string,
            address: data.address as string,
            email: data.email as string,
            insurance: data.insurance as string,
        };

        // First create FHIR resource if online
        if (isOnline && medplumClient) {
            try {
                await medplumClient.createResource({
                    resourceType: "Patient",
                    name: [{ use: "official", text: patientData.name }],
                    gender: patientData.gender,
                    birthDate: patientData.birthDate,
                    telecom: [
                        { system: "phone", value: patientData.phone, use: "home" },
                        { system: "email", value: patientData.email, use: "home" },
                    ],
                    address: [{ use: "home", text: patientData.address }],
                });
            } catch (error) {
                console.error("Error creating FHIR patient", error);
            }
        }

        // Use the onFinish function from refineCore to handle the form submission
        return onFinish(patientData);
    };

    return (
        <Create
            isLoading={formLoading}
            saveButtonProps={{
                ...saveButtonProps,
                onClick: handleSubmit(onSubmit)
            }}
            title={<Typography variant="h5">Create New Patient</Typography>}
        >
            <Card sx={{ boxShadow: 2 }}>
                <CardContent>
                    <Box
                        component="form"
                        sx={{ display: "flex", flexDirection: "column" }}
                        autoComplete="off"
                    >
                        <Grid container spacing={3}>
                            <Grid columns={12} columnSpacing={6}>
                                <TextField
                                    fullWidth
                                    label="First Name"
                                    variant="outlined"
                                    {...register('firstName', {
                                        required: "First name is required",
                                    })}
                                    error={!!errors.firstName}
                                    helperText={errors.firstName && String(errors.firstName.message)}
                                />
                            </Grid>
                            <Grid columns={12} columnSpacing={6}>
                                <TextField
                                    fullWidth
                                    label="Last Name"
                                    variant="outlined"
                                    {...register('lastName', {
                                        required: "Last name is required",
                                    })}
                                    error={!!errors.lastName}
                                    helperText={errors.lastName && String(errors.lastName.message)}
                                />
                            </Grid>
                            <Grid columns={12} columnSpacing={6}>
                                <Controller
                                    name="birthDate"
                                    control={control}
                                    rules={{
                                        required: "Date of birth is required",
                                        validate: (value) => {
                                            const parsedDate = new Date(value);
                                            return (
                                                !isNaN(parsedDate.getTime()) ||
                                                "Invalid date of birth"
                                            );
                                        },
                                    }}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            fullWidth
                                            type="date"
                                            label="Date of Birth"
                                            variant="outlined"
                                            InputLabelProps={{ shrink: true }}
                                            error={!!errors.birthDate}
                                            helperText={errors.birthDate && String(errors.birthDate.message)}
                                        />
                                    )}
                                />
                            </Grid>
                            <Grid columns={12} columnSpacing={6}>
                                <Controller
                                    name="gender"
                                    control={control}
                                    rules={{ required: "Gender is required" }}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            select
                                            fullWidth
                                            label="Gender"
                                            variant="outlined"
                                            error={!!errors.gender}
                                            helperText={errors.gender && String(errors.gender.message)}
                                        >
                                            <MenuItem value="male">Male</MenuItem>
                                            <MenuItem value="female">Female</MenuItem>
                                            <MenuItem value="unknown">Unknown</MenuItem>
                                        </TextField>
                                    )}
                                />
                            </Grid>
                            <Grid columns={12} columnSpacing={6}>
                                <TextField
                                    fullWidth
                                    label="Phone Number"
                                    variant="outlined"
                                    {...register('phoneNumber', {
                                        pattern: {
                                            value: /^\+?[0-9]{10,14}$/,
                                            message: "Invalid phone number",
                                        },
                                    })}
                                    error={!!errors.phoneNumber}
                                    helperText={errors.phoneNumber && String(errors.phoneNumber.message)}
                                />
                            </Grid>
                            <Grid columns={12}>
                                <TextField
                                    fullWidth
                                    label="Email"
                                    variant="outlined"
                                    {...register('email', {
                                        pattern: {
                                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                            message: "Invalid email",
                                        },
                                    })}
                                    error={!!errors.email}
                                    helperText={errors.email && String(errors.email.message)}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                </CardContent>
            </Card>
        </Create>
    );
};

export default PatientCreate;

// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
    CognitoIdentityProviderClient,
    InitiateAuthCommand,
    SignUpCommand,
    ConfirmSignUpCommand,
    AuthFlowType,
} from "@aws-sdk/client-cognito-identity-provider";
import config from "./config.json";
import { jwtDecode } from "jwt-decode";

const region = process.env.REACT_APP_COGNITO_REGION;
const userpool_id = process.env.REACT_APP_COGNITO_USERPOOLID;
const client_id = process.env.REACT_APP_COGNITO_CLIENTID;

export const cognitoClient = new CognitoIdentityProviderClient({
    region: region,
});

export const signIn = async (username: string, password: string) => {
    const params = {
        AuthFlow: AuthFlowType.USER_PASSWORD_AUTH, // Using AuthFlowType enum
        ClientId: client_id,
        AuthParameters: {
            USERNAME: username,
            PASSWORD: password,
        },
    };
    try {
        const command = new InitiateAuthCommand(params);
        const { AuthenticationResult } = await cognitoClient.send(command);
        if (AuthenticationResult) {
            sessionStorage.setItem(
                "idToken",
                AuthenticationResult.IdToken || ""
            );
            sessionStorage.setItem(
                "accessToken",
                AuthenticationResult.AccessToken || ""
            );
            sessionStorage.setItem(
                "refreshToken",
                AuthenticationResult.RefreshToken || ""
            );
            return AuthenticationResult;
        }
    } catch (error) {
        console.error("Error signing in: ", error);
        throw error;
    }
};

export const signUp = async (email: string, password: string) => {
    const params = {
        ClientId: client_id,
        Username: email,
        Password: password,
        UserAttributes: [
            {
                Name: "email",
                Value: email,
            },
        ],
    };
    try {
        const command = new SignUpCommand(params);
        const response = await cognitoClient.send(command);
        console.log("Sign up success: ", response);
        return response;
    } catch (error) {
        console.error("Error signing up: ", error);
        throw error;
    }
};

export const confirmSignUp = async (username: string, code: string) => {
    const params = {
        ClientId: client_id,
        Username: username,
        ConfirmationCode: code,
    };
    try {
        const command = new ConfirmSignUpCommand(params);
        await cognitoClient.send(command);
        console.log("User confirmed successfully");
        return true;
    } catch (error) {
        console.error("Error confirming sign up: ", error);
        throw error;
    }
};

export const getUserEmail = () => {
    const idToken = sessionStorage.getItem("idToken");
    if (idToken) {
        const decodedToken: any = jwtDecode(idToken);
        return decodedToken.email;
    }
    return null;
};

import NextAuth from 'next-auth';
import {authConfig} from "../../../../auth.config";

const handlers = NextAuth(authConfig);

export const GET = handlers.handlers.GET;
export const POST = handlers.handlers.POST;

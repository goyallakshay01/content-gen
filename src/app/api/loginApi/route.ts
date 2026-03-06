import { cookies } from "next/headers";
import { loginAction } from "../../login/actions";

export async function POST(req: Request) {
    try {
        const encodedData = await req.text(); // read raw body
        const decoded = atob(encodedData); // decode base64
        const body = JSON.parse(decoded); // convert to object

        const response = await loginAction(body);
        
        const cookieStore = await cookies();

        cookieStore.set("token", response.jwt, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            path: "/",
            maxAge: 60 * 60 * 24 * 7,
        });
        return Response.json({ response }, { status: 200 });
    } catch (error: any) {
        return Response.json(
            { error: error.message || "Something went wrong, please try again shortly" },
            { status: 500 }
        );
    }
}
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcrypt";

// Handles POST requests for user registration
export async function POST(req: NextRequest) {
    // Parse the request body to extract user data
    const { name, email, password } = await req.json();

    // Basic validation: check if all required fields are present
    if (!name || !email || !password) {
        const errors: { name?: string; email?: string; password?: string } = {};
        if (!name) errors.name = "Username is required.";
        if (!email) errors.email = "Email is required.";
        if (!password) errors.password = "Password is required.";
        // Return error response if any field is missing
        return NextResponse.json({ error: errors }, { status: 400 });
    }

    // Email format validation using regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        // Return error if email format is invalid
        return NextResponse.json({ error: { email: "Invalid email format." } }, { status: 400 });
    }

    // Password strength validation: minimum 6 characters
    if (password.length < 6) {
        // Return error if password is too short
        return NextResponse.json({ error: { password: "Password must be at least 6 characters long." } }, { status: 400 });
    }

    // Check if a user with the same email already exists in the database
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        // Return error if email is already registered
        return NextResponse.json({ error: { email: "An account with this email already exists." } }, { status: 400 });
    }

    // Hash the password before saving to the database for security
    const hashedPassword = await hash(password, 10);

    // Create the new user in the database with the provided data
    const user = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            role: "USER", // Default role assigned to new users
        },
    });

    // Return the created user's basic information (excluding password)
    return NextResponse.json({ id: user.id, email: user.email, name: user.name });
}
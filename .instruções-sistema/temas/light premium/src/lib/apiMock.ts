export async function registerUser(data: Record<string, any>) {
    // Simulate successful registration for static export
    return new Promise((resolve) => {
        setTimeout(() => resolve({ success: true, message: "Registered" }), 300);
    });
}

export default { registerUser };

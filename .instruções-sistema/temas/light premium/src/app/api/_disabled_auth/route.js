export const dynamic = "force-static";

export const GET = async () => {
  return new Response(JSON.stringify({ message: "Auth disabled for static export" }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};

export const POST = GET;

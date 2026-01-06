/** @type {import('next').NextConfig} */
// const basePath = "/symposium-nextjs";
const basePath = "";
const nextConfig = {
	// build static export output
	output: "export",
	// ensure exported pages end up as folders (helps GitHub Pages routing)
	trailingSlash: true,
	basePath: basePath || undefined,
	assetPrefix: basePath || undefined,
    images:{
        unoptimized:true
    },
    env:{
        NEXT_PUBLIC_BASE_PATH:basePath
    }
};

export default nextConfig;

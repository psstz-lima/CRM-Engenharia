export const QuickStart = () => {
    return (
        <div className="pb-10 md:scroll-m-[180px] scroll-m-28" id="start" >
          <h3 className="  text-2xl font-semibold mt-8 dark:text-white text-MidnightNavyText" >Quick Start</h3>
          <div className="p-6 rounded-md border mt-6 border-border dark:border-dark_border">
             <h6 className="dark:text-white text-MidnightNavyText text-lg font-semibold">1. Requirements</h6>
             <p className="text-base font-medium text-SlateBlueText dark:text-opacity-80">Before proceeding, you need to have the latest stable <a href="https://nodejs.org/" className="text-primary" >node.js</a> </p>
              <h6 className="mt-4 mb-2 dark:text-white text-MidnightNavyText text-dark font-medium text-base">Recommended environment:</h6>
              <ul className="list-disc ps-6" >
                <li>node js 20+</li>
                <li>npm js 10+</li>
              </ul>
          </div>
          <div className="p-6 rounded-md border mt-6 border-border dark:border-dark_border">
             <h6 className="dark:text-white text-MidnightNavyText text-lg font-semibold">2. Install</h6>
             <p className="text-base font-medium text-SlateBlueText dark:text-opacity-80">Open package folder and install its dependencies. We recommanded yarn or npm. </p>
              <h6 className="mt-4 mb-2 dark:text-white text-MidnightNavyText text-dark font-medium text-base">1) Install with npm:</h6>
              <div className="py-4 px-3 rounded-md bg-black">
                <p className="text-sm text-gray-400"><span className="text-yellow-500">cd</span> project-folder</p>
                <p className="text-sm text-gray-400 mt-2">npm install</p>
              </div>
              <h6 className="mt-4 mb-2 dark:text-white text-MidnightNavyText text-dark font-medium text-base">1) Install with yarn:</h6>
              <div className="py-4 px-3 rounded-md bg-black">
                <p className="text-sm text-gray-400"><span className="text-yellow-500">cd</span> project-folder</p>
                <p className="text-sm text-gray-400 mt-2">yarn install</p>
              </div>
          </div>
          <div className="p-6 rounded-md border mt-6 border-border dark:border-dark_border">
             <h6 className="dark:text-white text-MidnightNavyText text-lg font-semibold">3. Start</h6>
             <p className="text-base font-medium text-SlateBlueText dark:text-opacity-80 mb-4">Once npm install is done now you an run the app.</p>

              <div className="py-4 px-3 rounded-md bg-black">
                <p className="text-sm text-gray-400">npm run dev or yarn run dev</p>
              </div>
              <p className="text-base font-medium text-SlateBlueText dark:text-opacity-80 my-4">This command will start a local webserver <span className="dark:text-white text-MidnightNavyText" >http://localhost:3000:</span></p>
              <div className="py-4 px-3 rounded-md bg-black">
                <p className="text-sm text-gray-400">{"> symposium_project@1.0.1 dev"}</p>
                <p className="text-sm text-gray-400 mt-1">{"> next dev"}</p>
                <p className="text-sm text-gray-400 mt-6">{"-Next.js 15.1.1"}</p>
                <p className="text-sm text-gray-400 mt-1">{"-Local: http://localhost:3000"}</p>
              </div>
          </div>
          <div className="p-6 rounded-md border mt-6 border-border dark:border-dark_border">
             <h6 className="dark:text-white text-MidnightNavyText text-lg font-semibold">4. Build / Deployment</h6>
             <p className="text-base font-medium text-SlateBlueText dark:text-opacity-80 mb-4">After adding url run below command for build a app.</p>

              <div className="py-4 px-3 rounded-md bg-black">
                <p className="text-sm text-gray-400">npm run build or yarn build</p>
              </div>
              <p className="text-base font-medium text-SlateBlueText dark:text-opacity-80 mt-6">Finally, Your webiste is ready to be deployed.🥳</p>
          </div>
        </div>
    )
}
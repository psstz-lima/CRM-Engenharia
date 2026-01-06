export const ColorConfiguration = () => {
    return (
        <>
            <h3 className="  text-xl font-semibold mt-8 dark:text-white text-MidnightNavyText " >Colors</h3>
            <div className="p-6 rounded-md border mt-4 border-border dark:border-dark_border">
                <p className="text-base font-medium text-MidnightNavyText dark:text-white" ><span className="font-semibold text-lg">1. Override Colors</span> <br />
                    <span className="text-SlateBlueText dark:text-opacity-80" >For any change in colors : src/utils/extendedConfig.ts</span></p>
                <div className="py-4 px-5 rounded-md bg-black mt-8">
                    <p className="text-sm text-gray-400 flex flex-col gap-2">
                        <span>primary: "#2F73F2",</span>
                        <span>secondary: "#102C46",</span>
                        <span>SereneSky: "#8FACC6",</span>
                        <span>ElectricAqua: "#46C4FF",</span>
                        <span>RegalBlue: "#13439B",</span>
                        <span>IcyBreeze: "#EFFBFF",</span>
                        <span>Aquamarine: "#7DF9C2",</span>
                        <span>MidnightNavyText: "#102D47",</span>
                        <span>SlateBlueText : "#547593",</span>
                        <span>PaleSkyBlu: "#E0F7FF",</span>
                        <span>LightSkyBlue: "#B2D5EA",</span>
                        <span>PaleCerulean: "#A3BBD1",</span>
                        <span>darkmode: "#011120",</span>
                        <span>darklight: "#0d1a2c",</span>
                        <span>darktext: "#7F8487",</span>
                        <span>dark_border: "#224767",</span>
                    </p>
                </div>
            </div>
            <div className="p-6 rounded-md border mt-4 border-border dark:border-dark_border">
                <p className="text-base font-medium text-MidnightNavyText dark:text-white" ><span className="font-semibold text-lg">2. Override Theme Colors</span> <br />
                    <span className="text-SlateBlueText dark:text-opacity-80" >For change , go to : src/utils/extendedConfig.ts</span>
                    </p>
                <div className="py-4 px-5 rounded-md bg-black mt-8">
                    <p className="text-sm text-gray-400 flex flex-col gap-2">
                        <span>primary: "#2F73F2",</span>
                        <span>secondary: "#102C46",</span>
                    </p>
                </div>
            </div>
        </>
    )
}
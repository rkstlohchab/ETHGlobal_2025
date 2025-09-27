require("dotenv").config();
const hre = require("hardhat");

async function main() {
    const skylineOffering = "0x32dD2216Cb3FAfe41160bdb6108B646351590D2A";
    const harborOffering = "0x3C8cDFa48E2289F9393Ee1e1b3C374Ec8Fc298A3";
    const identityRegistryAddr = "0x87875DC8203918e47d5a3FBDB381a08a73F4dB0f";
    const tokenAddr = "0x2EdeA8e8B7bC572436020CD8403dfbEf39570000";

    async function diagnoseOffering(name, address) {
        console.log(`\n=== Checking ${name} Offering ===`);
        console.log(`Address: ${address}`);

        const offering = await hre.ethers.getContractAt("PropertyOffering", address);
        const token = await hre.ethers.getContractAt("Token", tokenAddr);
        const registry = await hre.ethers.getContractAt("IdentityRegistry", identityRegistryAddr);

        try {
            const inventory = await token.balanceOf(address);
            console.log(`Token inventory: ${hre.ethers.formatUnits(inventory, 18)} tokens`);

            const ethBalance = await hre.ethers.provider.getBalance(address);
            console.log(`ETH balance: ${hre.ethers.formatEther(ethBalance)} ETH`);

            const isRegistered = await registry.isVerified(address);
            console.log(`Registered in Identity Registry: ${isRegistered}`);

            const price = await offering.pricePerToken();
            console.log(`Price per token: ${hre.ethers.formatEther(price)} ETH`);

            const isFinalized = await offering.finalized();
            console.log(`Offering finalized: ${isFinalized}`);

            const isCanceled = await offering.canceled();
            console.log(`Offering canceled: ${isCanceled}`);

        } catch (error) {
            console.error("Error checking contract:", error.message);
        }
    }

    await diagnoseOffering("Skyline", skylineOffering);
    await diagnoseOffering("Harbor", harborOffering);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

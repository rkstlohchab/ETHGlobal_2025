require("dotenv").config();
const hre = require("hardhat");

async function main() {
    const tokenAddr = "0x2EdeA8e8B7bC572436020CD8403dfbEf39570000";
    const identityRegistryAddr = "0x87875DC8203918e47d5a3FBDB381a08a73F4dB0f";
    const skylineOffering = "0x32dD2216Cb3FAfe41160bdb6108B646351590D2A";
    const harborOffering = "0x3C8cDFa48E2289F9393Ee1e1b3C374Ec8Fc298A3";

    console.log("Setting up offerings...");

    // Get contract instances
    const [admin] = await hre.ethers.getSigners();
    console.log("Admin address:", admin.address);
    
    const registry = await hre.ethers.getContractAt("IdentityRegistry", identityRegistryAddr);
    const token = await hre.ethers.getContractAt("Token", tokenAddr);
    const skyline = await hre.ethers.getContractAt("PropertyOffering", skylineOffering);
    const harbor = await hre.ethers.getContractAt("PropertyOffering", harborOffering);

    // First grant AGENT_ROLE to token contract
    console.log("\nSetting up token permissions...");
    const agentRole = await token.AGENT_ROLE();
    const hasTokenRole = await token.hasRole(agentRole, admin.address);
    if (!hasTokenRole) {
        console.log("Granting token AGENT_ROLE to admin...");
        const tokenOwner = await token.owner();
        console.log("Token owner:", tokenOwner);
        if (tokenOwner.toLowerCase() === admin.address.toLowerCase()) {
            await token.grantRole(agentRole, admin.address);
            console.log("Waiting for token role grant...");
            await new Promise(resolve => setTimeout(resolve, 5000));
        } else {
            throw new Error("Admin is not token owner. Please grant AGENT_ROLE manually.");
        }
    }

    // Then grant AGENT_ROLE in registry
    console.log("\nSetting up registry permissions...");
    const registryRole = await registry.AGENT_ROLE();
    const hasRegistryRole = await registry.hasRole(registryRole, admin.address);
    if (!hasRegistryRole) {
        console.log("Granting registry AGENT_ROLE to admin...");
        const registryOwner = await registry.owner();
        console.log("Registry owner:", registryOwner);
        if (registryOwner.toLowerCase() === admin.address.toLowerCase()) {
            await registry.grantRole(registryRole, admin.address);
            console.log("Waiting for registry role grant...");
            await new Promise(resolve => setTimeout(resolve, 5000));
        } else {
            throw new Error("Admin is not registry owner. Please grant AGENT_ROLE manually.");
        }
    }

    // Register identities directly
    console.log("\nRegistering offerings in Identity Registry...");
    const countryCode = 356; // India
    
    console.log("Registering Skyline offering...");
    if (!(await registry.isVerified(skylineOffering))) {
        await registry.registerIdentity(skylineOffering, skylineOffering, countryCode);
        console.log("Waiting for registration...");
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    console.log("Registering Harbor offering...");
    if (!(await registry.isVerified(harborOffering))) {
        await registry.registerIdentity(harborOffering, harborOffering, countryCode);
        console.log("Waiting for registration...");
        await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // Mint tokens to offerings
    console.log("\nMinting tokens to offerings...");
    const amount = hre.ethers.parseUnits("10000", 18); // 10,000 tokens each
    
    const skylineBalance = await token.balanceOf(skylineOffering);
    if (skylineBalance < amount) {
        await token.mint(skylineOffering, amount);
        console.log("Waiting for Skyline mint...");
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    const harborBalance = await token.balanceOf(harborOffering);
    if (harborBalance < amount) {
        await token.mint(harborOffering, amount);
        console.log("Waiting for Harbor mint...");
        await new Promise(resolve => setTimeout(resolve, 5000));
    }

    // Update prices to 0.0001 ETH
    console.log("\nUpdating token prices...");
    const newPrice = hre.ethers.parseEther("0.0001");
    await skyline.updatePrice(newPrice);
    await harbor.updatePrice(newPrice);
    console.log("Waiting for price updates...");
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Seed ETH for buybacks (optional)
    console.log("\nSeeding ETH for buybacks...");
    const ethAmount = hre.ethers.parseEther("0.1"); // Reduced from 0.5 to 0.1
    
    const adminBalance = await hre.ethers.provider.getBalance(admin.address);
    console.log(`Admin ETH balance: ${hre.ethers.formatEther(adminBalance)} ETH`);
    
    if (adminBalance > ethAmount.mul(2)) {
        const skylineEthBalance = await hre.ethers.provider.getBalance(skylineOffering);
        if (skylineEthBalance < ethAmount) {
            await admin.sendTransaction({ to: skylineOffering, value: ethAmount });
            console.log("Waiting for Skyline ETH transfer...");
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
        
        const harborEthBalance = await hre.ethers.provider.getBalance(harborOffering);
        if (harborEthBalance < ethAmount) {
            await admin.sendTransaction({ to: harborOffering, value: ethAmount });
            console.log("Waiting for Harbor ETH transfer...");
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    } else {
        console.log("Skipping ETH seeding - insufficient balance");
    }

    // Run final checks
    console.log("\nRunning final checks...");
    const skylineVerified = await registry.isVerified(skylineOffering);
    const harborVerified = await registry.isVerified(harborOffering);
    const skylineTokens = await token.balanceOf(skylineOffering);
    const harborTokens = await token.balanceOf(harborOffering);
    const skylinePrice = await skyline.pricePerToken();
    const harborPrice = await harbor.pricePerToken();
    
    console.log("\nFinal Status:");
    console.log(`Skyline Offering (${skylineOffering}):`);
    console.log(`- Verified: ${skylineVerified}`);
    console.log(`- Token Balance: ${hre.ethers.formatUnits(skylineTokens, 18)}`);
    console.log(`- Price per Token: ${hre.ethers.formatEther(skylinePrice)} ETH`);
    console.log(`- ETH Balance: ${hre.ethers.formatEther(await hre.ethers.provider.getBalance(skylineOffering))} ETH`);
    
    console.log(`\nHarbor Offering (${harborOffering}):`);
    console.log(`- Verified: ${harborVerified}`);
    console.log(`- Token Balance: ${hre.ethers.formatUnits(harborTokens, 18)}`);
    console.log(`- Price per Token: ${hre.ethers.formatEther(harborPrice)} ETH`);
    console.log(`- ETH Balance: ${hre.ethers.formatEther(await hre.ethers.provider.getBalance(harborOffering))} ETH`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
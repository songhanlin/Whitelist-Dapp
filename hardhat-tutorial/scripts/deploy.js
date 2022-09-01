const { ethers } = require("hardhat");

async function main() {
  /*
  ethers.js 中的 ContractFactory 是用于部署新智能合约的抽象，
  所以 whitelistContract 这里是我们白名单合约实例的工厂。
  */
  const whitelistContract = await ethers.getContractFactory("Whitelist");

  // 这里我们部署合约
  const deployedWhitelistContract = await whitelistContract.deploy(10);
  // 10 是允许的最大白名单地址数

  // 等待它完成部署
  await deployedWhitelistContract.deployed();

  // 打印部署合约的地址
  console.log("Whitelist Contract Address:", deployedWhitelistContract.address);
}

// 调用main函数，如果有错误就catch
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

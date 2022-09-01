import Head from "next/head";
import styles from "../styles/Home.module.css";
import Web3Modal from "web3modal";
import { providers, Contract } from "ethers";
import { useEffect, useRef, useState } from "react";
import { WHITELIST_CONTRACT_ADDRESS, abi } from "../constants";

export default function Home() {
  // walletConnected 跟踪用户的钱包是否连接
  const [walletConnected, setWalletConnected] = useState(false);
  // joinedWhitelist 跟踪当前元掩码地址是否加入白名单
  const [joinedWhitelist, setJoinedWhitelist] = useState(false);
  // 当我们等待交易被挖掘时，loading 设置为 true
  const [loading, setLoading] = useState(false);
  // numberOfWhitelisted 跟踪地址的白名单数量
  const [numberOfWhitelisted, setNumberOfWhitelisted] = useState(0);
  // 创建对 Web3 Modal 的引用（用于连接到 Metamask），只要页面打开，它就会一直存在
  const web3ModalRef = useRef();

  /**
   * 返回代表以太坊 RPC 的 Provider 或 Signer 对象，带有或不带有
   * 附加元掩码的签名功能
   *
   * 需要一个 `Provider` 来与区块链交互 - 读取交易、读取余额、读取状态等
   *
   * `Signer` 是一种特殊类型的 Provider，用于在需要对区块链进行`write` 交易的情况下，这涉及到连接的帐户
   * 需要进行数字签名以授权正在发送的交易。Metamask 公开了一个 Signer API 以允许您的网站
   * 使用 Signer 函数向用户请求签名。
   *
   * @param {*} needSigner - 如果需要签名者则为真，否则默认为假
   */
  const getProviderOrSigner = async (needSigner = false) => {
    // 连接到 Metamask
    // 因为我们存储 `web3Modal` 作为参考，我们需要访问 `current` 值来访问底层对象
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    // 如果用户没有连接到 Rinkeby 网络，让他们知道并抛出错误
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 4) {
      window.alert("Change the network to Rinkeby");
      throw new Error("Change network to Rinkeby");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  /**
   * addAddressToWhitelist：将当前连接的地址添加到白名单
   */
  const addAddressToWhitelist = async () => {
    try {
      // 我们在这里需要一个签名者，因为这是一个“写入”事务。
      const signer = await getProviderOrSigner(true);
      // 使用 Signer 创建一个新的 Contract 实例，它允许
      // 更新方法
      const whitelistContract = new Contract(
        WHITELIST_CONTRACT_ADDRESS,
        abi,
        signer
      );
      // 从合约中调用 addAddressToWhitelist
      const tx = await whitelistContract.addAddressToWhitelist();
      setLoading(true);
      // 等待交易被挖掘
      await tx.wait();
      setLoading(false);
      // 获取更新后的白名单地址数
      await getNumberOfWhitelisted();
      setJoinedWhitelist(true);
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * getNumberOfWhitelisted: 获取白名单地址的数量
   */
  const getNumberOfWhitelisted = async () => {
    try {
      // 从 web3Modal 获取提供者，在我们的例子中是 MetaMask
      // 这里不需要签名者，因为我们仅从区块链中读取状态
      const provider = await getProviderOrSigner();
      // 我们使用提供者连接到合约，因此我们将只有
      // 对合约拥有只读权限
      const whitelistContract = new Contract(
        WHITELIST_CONTRACT_ADDRESS,
        abi,
        provider
      );
      // 从合约中调用 numAddressesWhitelisted
      const _numberOfWhitelisted =
        await whitelistContract.numAddressesWhitelisted();
      setNumberOfWhitelisted(_numberOfWhitelisted);
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * checkIfAddressInWhitelist: 检查地址是否在白名单中
   */
  const checkIfAddressInWhitelist = async () => {
    try {
      // 我们稍后需要签名者来获取用户的地址
      // 即使它是一个读交易，因为签名者只是特殊类型的提供者，
      // 我们可以在它的位置使用它
      const signer = await getProviderOrSigner(true);
      const whitelistContract = new Contract(
        WHITELIST_CONTRACT_ADDRESS,
        abi,
        signer
      );
      // 获取与 MetaMask 连接的签名者关联的地址
      const address = await signer.getAddress();
      // 从合约中调用 whitelistedAddresses
      const _joinedWhitelist = await whitelistContract.whitelistedAddresses(
        address
      );
      setJoinedWhitelist(_joinedWhitelist);
    } catch (err) {
      console.error(err);
    }
  };

  /*
    connectWallet: 连接 MetaMask 钱包
  */
  const connectWallet = async () => {
    try {
      // 从 web3Modal 获取提供者，在我们的例子中是 MetaMask
      // 第一次使用时提示用户连接他们的钱包
      await getProviderOrSigner();
      setWalletConnected(true);

      checkIfAddressInWhitelist();
      getNumberOfWhitelisted();
    } catch (err) {
      console.error(err);
    }
  };

  /*
    renderButton: 根据 dapp 的状态返回一个按钮
  */
  const renderButton = () => {
    if (walletConnected) {
      if (joinedWhitelist) {
        return (
          <div className={styles.description}>
            Thanks for joining the Whitelist!
          </div>
        );
      } else if (loading) {
        return <button className={styles.button}>Loading...</button>;
      } else {
        return (
          <button onClick={addAddressToWhitelist} className={styles.button}>
            Join the Whitelist
          </button>
        );
      }
    } else {
      return (
        <button onClick={connectWallet} className={styles.button}>
          Connect your wallet
        </button>
      );
    }
  };

  // useEffects 用于对网站状态的变化做出反应
  // 函数调用末尾的数组表示什么状态变化会触发这个效果
  // 在这种情况下，只要 `walletConnected` 的值发生变化 - 这个效果就会被称为
  useEffect(() => {
    // 如果钱包没有连接，则创建一个新的 Web3Modal 实例并连接 MetaMask 钱包
    if (!walletConnected) {
      // 通过将 Web3Modal 类设置为 `current` 将其分配给引用对象value
      // 只要此页面打开，`current` 值就会一直保持
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();
    }
  }, [walletConnected]);

  return (
    <div>
      <Head>
        <title>Whitelist Dapp</title>
        <meta name="description" content="Whitelist-Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.main}>
        <div>
          <h1 className={styles.title}>Welcome to Crypto Devs!</h1>
          <div className={styles.description}>
            Its an NFT collection for developers in Crypto.
          </div>
          <div className={styles.description}>
            {numberOfWhitelisted} have already joined the Whitelist
          </div>
          {renderButton()}
        </div>
        <div>
          <img className={styles.image} src="./crypto-devs.svg" />
        </div>
      </div>

      <footer className={styles.footer}>
        Made with &#10084; by Crypto Devs
      </footer>
    </div>
  );
}

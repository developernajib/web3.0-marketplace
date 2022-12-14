/* eslint-disable quotes */
/* eslint-disable no-new */
import React, { useState, useEffect } from "react";
import Web3Modal from "web3modal";
import { ethers } from "ethers";
import axios from "axios";
import { create } from "ipfs-http-client";

import { MarketAddress, MarketAddressABI } from "./constants";

const ipfsClient = require("ipfs-http-client");

const projectId = process.env.NEXT_PUBLIC_PROJECT_ID;
const projectSecret = process.env.NEXT_PUBLIC_PROJECT_SECRET_KEY;

const auth = `Basic ${Buffer.from(`${projectId}:${projectSecret}`).toString(
  "base64",
)}`;

const client = ipfsClient.create({
  host: "ipfs.infura.io",
  port: 5001,
  protocol: "https",
  headers: {
    authorization: auth,
  },
});

const fetchContract = (signerOrProvider) => new ethers.Contract(MarketAddress, MarketAddressABI, signerOrProvider);

export const NFTContext = React.createContext();

export const NFTProvider = ({ children }) => {
  const [currentAccount, setCurrentAccount] = useState("");
  const nftCurrency = "ETH";

  const checkIfWalletIfConnected = async () => {
    if (!window.ethereum) {
      return alert("Please connect your digital wallet");
    }
    const accounts = await window.ethereum.request({
      method: "eth_accounts",
    });

    if (accounts.length) {
      setCurrentAccount(accounts[0]);
    } else {
      console.log("No accounts found.");
    }
  };

  useEffect(() => {
    checkIfWalletIfConnected();
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) {
      return alert(
        "Please connect your digital wallet (Recommended: Metamask)",
      );
    }

    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    setCurrentAccount(accounts[0]);
    window.location.reload();
  };

  const uploadToIPFS = async (file, setFileUrl) => {
    try {
      const added = await client.add({ content: file });
      const url = `https://ipfs.io/ipfs/${added.path}`;
      return url;
    } catch (error) {
      console.log("Error while uploading file to IPFS:- ", error);
    }
  };

  const createNFT = async (formInput, fileUrl, router) => {
    const { name, description, price } = formInput;

    if (!name || !description || !price || !fileUrl) return;
    const data = JSON.stringify({ name, description, image: fileUrl });

    try {
      const added = await client.add(data);
      const url = `https://ipfs.io/ipfs/${added.path}`;
      await createSale(url, price);
      router.push("/");
    } catch (error) {
      console.log("Error while uploading file to IPFS:- ", error);
    }
  };

  const createSale = async (url, formInputPrice, isReselling, id) => {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();
    const price = ethers.utils.parseUnits(formInputPrice, "ether");
    const contract = fetchContract(signer);

    const listingPrice = await contract.getListingPrice();
    const transaction = await contract.createToken(url, price, {
      value: listingPrice.toString(),
    });
    await transaction.wait();
  };

  const fetchNFTs = async () => {
    const provider = new ethers.providers.JsonRpcProvider();
    const contract = fetchContract(provider);
    const data = await contract.fetchMarketItems();
    // console.log(data);

    const items = await Promise.all(
      data.map(
        async ({ tokenId, seller, owner, price: unformattedPrice }) => {
          const tokenURI = await contract.tokenURI(tokenId);
          if (tokenURI === "test") {
            const nftDefaultObject = {
              price: "0.1",
              tokenId: 4,
              seller: "0xbeee513429DE951C14bDA24398D71861bA139e8c",
              owner: "0x8dC5c8B4471978607aA4880326E68CF814Bc6Bb8",
              image: "https://ipfs.io/ipfs/QmdWpdpuTGnbEbMkPvXWEAHdwrDJu2tWNdcgyDmDxUj8VC",
              name: "test nft",
              description: "test",
              tokenURI: "https://ipfs.io/ipfs/Qmddw2bkMH6CQubiu2AFy5s6qd8nUkiWf1BrrHReqDTx5m",
            };
            return nftDefaultObject;
          }
          const { data: { image, name, description } } = await axios.get(tokenURI);
          const price = ethers.utils.formatUnits(
            unformattedPrice.toString(),
            "ether",
          );
          return {
            price,
            tokenId: tokenId.toNumber(),
            seller,
            owner,
            image,
            name,
            description,
            tokenURI,
          };
        },
      ),
    );
    return items;
  };

  const fetchMyNFTsOrListedNFTs = async (type) => {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    const contract = fetchContract(signer);
    const data = type === "fetchItemsListed" ? await contract.fetchItemsListed() : await contract.fetchMyNFTs();

    const items = await Promise.all(
      data.map(
        async ({ tokenId, seller, owner, price: unformattedPrice }) => {
          const tokenURI = await contract.tokenURI(tokenId);
          if (tokenURI === "test") {
            const nftDefaultObject = {
              price: "0.1",
              tokenId: 4,
              seller: "0xbeee513429DE951C14bDA24398D71861bA139e8c",
              owner: "0x8dC5c8B4471978607aA4880326E68CF814Bc6Bb8",
              image: "https://ipfs.io/ipfs/QmdWpdpuTGnbEbMkPvXWEAHdwrDJu2tWNdcgyDmDxUj8VC",
              name: "test nft",
              description: "test",
              tokenURI: "https://ipfs.io/ipfs/Qmddw2bkMH6CQubiu2AFy5s6qd8nUkiWf1BrrHReqDTx5m",
            };
            return nftDefaultObject;
          }
          const { data: { image, name, description } } = await axios.get(tokenURI);
          const price = ethers.utils.formatUnits(
            unformattedPrice.toString(),
            "ether",
          );
          return {
            price,
            tokenId: tokenId.toNumber(),
            seller,
            owner,
            image,
            name,
            description,
            tokenURI,
          };
        },
      ),
    );
    return items;
  };

  const buyNFT = async (nft) => {
    const web3Modal = new Web3Modal();
    const connection = await web3Modal.connect();
    const provider = new ethers.providers.Web3Provider(connection);
    const signer = provider.getSigner();

    const contract = fetchContract(signer);
    const price = ethers.utils.parseUnits(nft.price.toString(), "ether");

    const transaction = await contract.createMarketSale(nft.tokenId, { value: price });
    await transaction.wait();
  };

  return (
    <NFTContext.Provider
      value={{
        nftCurrency,
        connectWallet,
        currentAccount,
        uploadToIPFS,
        createNFT,
        fetchNFTs,
        fetchMyNFTsOrListedNFTs,
        buyNFT,
      }}
    >
      {children}
    </NFTContext.Provider>
  );
};

import { useState } from "react";
import { useContractRead, useWalletClient, WalletClient } from "wagmi";
import { zeroAddress } from "viem";
import { ERC20ABI } from "./abi.js";
import {
	Eip2612Props,
	PermitSignature,
	signPermit,
	signPermitDai,
	SignPermitProps,
} from "./permit.js";

export function usePermit({
	contractAddress,
	chainId,
	walletClient,
	ownerAddress,
	spenderAddress,
	permitVersion,
}: UsePermitProps) {
	const [signature, setSignature] = useState<PermitSignature | undefined>();
	const [error, setError] = useState();

	const { data: defaultWalletClient } = useWalletClient();
	const walletClientToUse = walletClient ?? defaultWalletClient;
	const ownerToUse =
		ownerAddress ?? walletClientToUse?.account.address ?? zeroAddress;
	const { data: nonce } = useContractRead({
		chainId,
		address: contractAddress,
		abi: ERC20ABI,
		functionName: "nonces",
		args: [ownerToUse],
	});
	const { data: name } = useContractRead({
		chainId,
		address: contractAddress,
		abi: ERC20ABI,
		functionName: "name",
	});
	const { data: versionFromContract } = useContractRead({
		chainId,
		address: contractAddress,
		abi: ERC20ABI,
		functionName: "version",
	});
	const version = permitVersion ?? versionFromContract ?? "1";
	const ready =
		walletClientToUse !== null &&
		walletClientToUse !== undefined &&
		spenderAddress !== undefined &&
		chainId !== undefined &&
		contractAddress !== undefined &&
		name !== undefined &&
		nonce !== undefined;

	return {
		signPermitDai: ready
			? (
					props: PartialBy<
						SignPermitProps,
						| "chainId"
						| "ownerAddress"
						| "contractAddress"
						| "spenderAddress"
						| "nonce"
						| "erc20Name"
						| "permitVersion"
					> & {
						walletClient?: WalletClient;
					},
			  ) =>
					signPermitDai(props.walletClient ?? walletClientToUse, {
						chainId,
						ownerAddress:
							ownerAddress ??
							props.walletClient?.account.address ??
							walletClientToUse.account.address,
						contractAddress: contractAddress,
						spenderAddress: spenderAddress ?? zeroAddress,
						erc20Name: name,
						permitVersion: version,
						nonce,
						...props,
					})
						.then((signature) => {
							setSignature(signature);
							return signature;
						})
						.catch((error) => {
							setError(error);
							throw error;
						})
			: undefined,
		signPermit: ready
			? (
					props: PartialBy<
						Eip2612Props,
						| "chainId"
						| "ownerAddress"
						| "contractAddress"
						| "spenderAddress"
						| "nonce"
						| "erc20Name"
						| "permitVersion"
					> & {
						walletClient?: WalletClient;
					},
			  ) =>
					signPermit(props.walletClient ?? walletClientToUse, {
						chainId,
						ownerAddress:
							ownerAddress ??
							props.walletClient?.account.address ??
							walletClientToUse.account.address,
						contractAddress: contractAddress,
						spenderAddress: spenderAddress ?? zeroAddress,
						erc20Name: name,
						nonce,
						permitVersion: version,
						...props,
					})
						.then((signature) => {
							setSignature(signature);
							return signature;
						})
						.catch((error) => {
							setError(error);
							throw error;
						})
			: undefined,
		signature,
		error,
	};
}

export type UsePermitProps = Partial<SignPermitProps> & {
	walletClient: WalletClient;
};

type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

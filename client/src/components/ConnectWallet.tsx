import { Button } from "./ui/button";
import { Wallet, Loader2, LogOut } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export function ConnectWallet() {
  const { address, isConnected, isConnecting, usdcBalance, connect, disconnect } = useWallet();

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  if (isConnecting) {
    return (
      <Button disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Connecting...
      </Button>
    );
  }

  if (isConnected && address) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Wallet className="h-4 w-4" />
            {formatAddress(address)}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>My Wallet</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <div className="px-2 py-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">USDC Balance:</span>
              <span className="font-semibold">${parseFloat(usdcBalance).toFixed(2)}</span>
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={disconnect} className="text-red-600 cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button onClick={connect} className="gap-2">
      <Wallet className="h-4 w-4" />
      Connect Wallet
    </Button>
  );
}

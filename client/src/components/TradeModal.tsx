import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { trpc } from "@/lib/trpc";
import { Loader2, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { toast } from "sonner";
import { useWallet } from "@/contexts/WalletContext";

interface Market {
  id: string;
  title: string;
  venue: string;
  probability?: number;
  url: string;
}

interface TradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  market: Market | null;
}

export function TradeModal({ open, onOpenChange, market }: TradeModalProps) {
  const { address, isConnected, connect, signPolymarketTrade } = useWallet();
  const [side, setSide] = useState<"yes" | "no">("yes");
  const [amount, setAmount] = useState<string>("10");
  const [orderType, setOrderType] = useState<"market" | "limit">("market");
  const [limitPrice, setLimitPrice] = useState<string>("");

  const placeKalshiOrder = trpc.trading.placeKalshiOrder.useMutation({
    onSuccess: () => {
      toast.success("Order placed successfully!");
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to place order: ${error.message}`);
    },
  });

  const placePolymarketOrder = trpc.trading.placePolymarketOrder.useMutation({
    onSuccess: () => {
      toast.success("Order placed successfully!");
      onOpenChange(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to place order: ${error.message}`);
    },
  });

  const resetForm = () => {
    setSide("yes");
    setAmount("10");
    setOrderType("market");
    setLimitPrice("");
  };

  const handlePlaceOrder = async () => {
    if (!market) return;

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (orderType === "limit" && (!limitPrice || parseFloat(limitPrice) <= 0)) {
      toast.error("Please enter a valid limit price");
      return;
    }

    // For Polymarket, require wallet connection
    if (market.venue === "polymarket") {
      if (!isConnected) {
        toast.error("Please connect your wallet to trade on Polymarket");
        await connect();
        return;
      }

      try {
        // Sign the trade with MetaMask
        const price = orderType === "market" ? (market.probability || 0.5) : parseFloat(limitPrice);
        const signature = await signPolymarketTrade(
          market.id,
          price,
          amountNum,
          "BUY"
        );

        // Submit signed trade to backend
        // Note: Signature is generated but not sent to backend in current implementation
        // Backend will use server-side Polymarket credentials
        placePolymarketOrder.mutate({
          tokenId: market.id,
          price,
          size: amountNum,
          side: "BUY",
        });
      } catch (error: any) {
        toast.error(`Failed to sign trade: ${error.message}`);
        return;
      }
    } else if (market.venue === "kalshi") {
      placeKalshiOrder.mutate({
        ticker: market.id,
        action: "buy",
        side,
        count: Math.floor(amountNum), // Kalshi uses contracts
        type: orderType,
        ...(orderType === "limit" && {
          [side === "yes" ? "yesPrice" : "noPrice"]: Math.round(parseFloat(limitPrice) * 100), // Convert to cents
        }),
      });
    }
  };

  const isLoading = placeKalshiOrder.isPending || placePolymarketOrder.isPending;
  const currentPrice = market?.probability || 0.5;
  const potentialProfit = parseFloat(amount) / currentPrice - parseFloat(amount);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Place Trade</DialogTitle>
          <DialogDescription>
            {market?.title}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Side Selection */}
          <div className="space-y-3">
            <Label>Position</Label>
            <RadioGroup value={side} onValueChange={(v) => setSide(v as "yes" | "no")}>
              <div className="flex gap-3">
                <div
                  className={`flex-1 flex items-center space-x-2 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                    side === "yes"
                      ? "border-green-500 bg-green-500/10"
                      : "border-border hover:border-green-500/50"
                  }`}
                  onClick={() => setSide("yes")}
                >
                  <RadioGroupItem value="yes" id="yes" />
                  <Label htmlFor="yes" className="flex items-center gap-2 cursor-pointer flex-1">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <div>
                      <div className="font-semibold">Yes</div>
                      <div className="text-sm text-muted-foreground">
                        {Math.round(currentPrice * 100)}¢
                      </div>
                    </div>
                  </Label>
                </div>

                <div
                  className={`flex-1 flex items-center space-x-2 rounded-lg border-2 p-4 cursor-pointer transition-all ${
                    side === "no"
                      ? "border-red-500 bg-red-500/10"
                      : "border-border hover:border-red-500/50"
                  }`}
                  onClick={() => setSide("no")}
                >
                  <RadioGroupItem value="no" id="no" />
                  <Label htmlFor="no" className="flex items-center gap-2 cursor-pointer flex-1">
                    <TrendingDown className="h-4 w-4 text-red-500" />
                    <div>
                      <div className="font-semibold">No</div>
                      <div className="text-sm text-muted-foreground">
                        {Math.round((1 - currentPrice) * 100)}¢
                      </div>
                    </div>
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Order Type */}
          <div className="space-y-3">
            <Label>Order Type</Label>
            <RadioGroup value={orderType} onValueChange={(v) => setOrderType(v as "market" | "limit")}>
              <div className="flex gap-3">
                <div
                  className={`flex-1 flex items-center space-x-2 rounded-lg border-2 p-3 cursor-pointer transition-all ${
                    orderType === "market"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => setOrderType("market")}
                >
                  <RadioGroupItem value="market" id="market" />
                  <Label htmlFor="market" className="cursor-pointer">Market</Label>
                </div>

                <div
                  className={`flex-1 flex items-center space-x-2 rounded-lg border-2 p-3 cursor-pointer transition-all ${
                    orderType === "limit"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => setOrderType("limit")}
                >
                  <RadioGroupItem value="limit" id="limit" />
                  <Label htmlFor="limit" className="cursor-pointer">Limit</Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">
              Amount ({market?.venue === "kalshi" ? "Contracts" : "USDC"})
            </Label>
            <Input
              id="amount"
              type="number"
              min="1"
              step="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="10"
            />
          </div>

          {/* Limit Price (if limit order) */}
          {orderType === "limit" && (
            <div className="space-y-2">
              <Label htmlFor="limitPrice">Limit Price</Label>
              <Input
                id="limitPrice"
                type="number"
                min="0.01"
                max="0.99"
                step="0.01"
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                placeholder="0.50"
              />
            </div>
          )}

          {/* Summary */}
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Cost</span>
              <span className="font-semibold">${amount || "0"}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Potential Profit</span>
              <span className="font-semibold text-green-500">
                ${potentialProfit.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Venue</span>
              <span className="font-semibold capitalize">{market?.venue}</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          {market?.venue === "polymarket" && !isConnected ? (
            <Button onClick={connect}>
              <Wallet className="mr-2 h-4 w-4" />
              Connect Wallet
            </Button>
          ) : (
            <Button onClick={handlePlaceOrder} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Place Order
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

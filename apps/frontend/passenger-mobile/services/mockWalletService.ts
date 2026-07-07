import mockWalletData from '@/data/mockWalletData.json';
import { WalletTransaction, Wallet } from '@/types';

export interface MockWallet {
  id: string;
  userId: string;
  balance: number;
  travelCard: {
    cardNumber: string;
    maskedCardNumber: string;
    expiryDate: string;
    holderName: string;
    issuedDate: string;
    status: 'active' | 'blocked' | 'pending' | 'expired';
    cvv: string;
    cardType: string;
  };
  recentTransactions: WalletTransaction[];
  allTransactions: WalletTransaction[];
  paymentMethods: PaymentMethod[];
  notifications: {
    lowBalanceAlert: boolean;
    transactionAlerts: boolean;
    promotionalOffers: boolean;
    lowBalanceThreshold: number;
  };
  settings: {
    autoTopup: {
      enabled: boolean;
      threshold: number;
      amount: number;
      paymentMethodId: string;
    };
    spendingLimits: {
      daily: number;
      monthly: number;
    };
  };
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank';
  name: string;
  cardNumber?: string;
  accountNumber?: string;
  expiryDate?: string;
  cardType?: 'visa' | 'mastercard' | 'amex';
  bankName?: string;
  isDefault: boolean;
  isActive: boolean;
}

export interface CardRequest {
  id: string;
  userId: string;
  email: string;
  requestDate: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  estimatedDelivery?: string;
  deliveredDate?: string;
  deliveryAddress: string;
  trackingNumber?: string;
  cardFee: number;
  deliveryFee: number;
  totalFee: number;
}

export interface BlockedCard {
  id: string;
  userId: string;
  email: string;
  cardNumber: string;
  blockDate: string;
  reason: string;
  balanceTransferred: number;
  status: 'blocked';
}

export class MockWalletService {
  static getWalletByEmail(email: string): MockWallet | null {
    const walletData = mockWalletData.wallets[email as keyof typeof mockWalletData.wallets];
    return walletData || null;
  }

  static getWalletByUserId(userId: string): MockWallet | null {
    const wallets = Object.values(mockWalletData.wallets);
    return wallets.find(wallet => wallet.userId === userId) || null;
  }

  static getRecentTransactions(email: string, limit: number = 5): WalletTransaction[] {
    const wallet = this.getWalletByEmail(email);
    if (!wallet) return [];
    return wallet.recentTransactions.slice(0, limit);
  }

  static getAllTransactions(email: string): WalletTransaction[] {
    const wallet = this.getWalletByEmail(email);
    if (!wallet) return [];
    return wallet.allTransactions;
  }

  static getTransactionsByType(email: string, type: string): WalletTransaction[] {
    const wallet = this.getWalletByEmail(email);
    if (!wallet) return [];
    return wallet.allTransactions.filter(transaction => transaction.type === type);
  }

  static getTransactionsByStatus(email: string, status: string): WalletTransaction[] {
    const wallet = this.getWalletByEmail(email);
    if (!wallet) return [];
    return wallet.allTransactions.filter(transaction => transaction.status === status);
  }

  static getPaymentMethods(email: string): PaymentMethod[] {
    const wallet = this.getWalletByEmail(email);
    if (!wallet) return [];
    return wallet.paymentMethods;
  }

  static getDefaultPaymentMethod(email: string): PaymentMethod | null {
    const paymentMethods = this.getPaymentMethods(email);
    return paymentMethods.find(method => method.isDefault) || null;
  }

  static getTravelCard(email: string) {
    const wallet = this.getWalletByEmail(email);
    if (!wallet) return null;
    return wallet.travelCard;
  }

  static getBalance(email: string): number {
    const wallet = this.getWalletByEmail(email);
    return wallet?.balance || 0;
  }

  static getCardRequests(email: string): CardRequest[] {
    return mockWalletData.cardRequests.filter(request => request.email === email);
  }

  static getLatestCardRequest(email: string): CardRequest | null {
    const requests = this.getCardRequests(email);
    return requests.length > 0 ? requests[requests.length - 1] : null;
  }

  static getBlockedCards(email: string): BlockedCard[] {
    return mockWalletData.blockedCards.filter(card => card.email === email);
  }

  static getActivePromotions() {
    return mockWalletData.promotions.filter(promo => promo.isActive);
  }

  static getWalletSettings(email: string) {
    const wallet = this.getWalletByEmail(email);
    return wallet?.settings || null;
  }

  static getNotificationSettings(email: string) {
    const wallet = this.getWalletByEmail(email);
    return wallet?.notifications || null;
  }

  // Utility methods for transaction analysis
  static getMonthlySpending(email: string, month: number, year: number): number {
    const transactions = this.getAllTransactions(email);
    return transactions
      .filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.getMonth() === month && 
               transactionDate.getFullYear() === year &&
               (t.type === 'payment' || t.type === 'card-use') &&
               t.status === 'completed';
      })
      .reduce((total, t) => total + t.amount, 0);
  }

  static getDailySpending(email: string, date: Date): number {
    const transactions = this.getAllTransactions(email);
    const dateString = date.toDateString();
    return transactions
      .filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate.toDateString() === dateString &&
               (t.type === 'payment' || t.type === 'card-use') &&
               t.status === 'completed';
      })
      .reduce((total, t) => total + t.amount, 0);
  }

  static getTopupHistory(email: string): WalletTransaction[] {
    return this.getTransactionsByType(email, 'topup');
  }

  static getPaymentHistory(email: string): WalletTransaction[] {
    return this.getTransactionsByType(email, 'payment');
  }

  static getCardUsageHistory(email: string): WalletTransaction[] {
    return this.getTransactionsByType(email, 'card-use');
  }

  static getRefundHistory(email: string): WalletTransaction[] {
    return this.getTransactionsByType(email, 'refund');
  }

  // Simulation methods for testing
  static simulateTopup(email: string, amount: number, paymentMethodId: string): boolean {
    // In a real app, this would make an API call
    console.log(`Simulating top-up of LKR ${amount} for ${email} using payment method ${paymentMethodId}`);
    return true;
  }

  static simulateCardRequest(email: string, deliveryAddress: string): boolean {
    // In a real app, this would make an API call
    console.log(`Simulating card request for ${email} to be delivered to ${deliveryAddress}`);
    return true;
  }

  static simulateCardBlock(email: string, reason: string): boolean {
    // In a real app, this would make an API call
    console.log(`Simulating card block for ${email} with reason: ${reason}`);
    return true;
  }
}

export default MockWalletService;
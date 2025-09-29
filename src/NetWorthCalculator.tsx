import React, { useMemo } from 'react';
import { type Assets, type Liabilities, type Financials } from './db.ts';

interface NetWorthCalculatorProps {
  data: { assets: Assets; liabilities: Liabilities };
  onUpdate: (updatedData: Partial<Financials>) => void;
  onClose: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value);
};

const NetWorthCalculator: React.FC<NetWorthCalculatorProps> = ({ data, onUpdate, onClose }) => {
  const { assets, liabilities } = data;

  const handleAssetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    const updatedAssets = { ...assets, [id]: Number(value) || 0 };
    onUpdate({ assets: updatedAssets });
  };
  
  const handleLiabilityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    const updatedLiabilities = { ...liabilities, [id]: Number(value) || 0 };
    onUpdate({ liabilities: updatedLiabilities });
  };
  
  const totalAssets = useMemo(() => Object.keys(assets).reduce((sum, key) => sum + Number(assets[key as keyof Assets] || 0), 0), [assets]);
  const totalLiabilities = useMemo(() => Object.keys(liabilities).reduce((sum, key) => sum + Number(liabilities[key as keyof Liabilities] || 0), 0), [liabilities]);
  const netWorth = useMemo(() => totalAssets - totalLiabilities, [totalAssets, totalLiabilities]);

  return (
    <div className="card">
      <h2>Net Worth: <span className="total">{formatCurrency(netWorth)}</span></h2>
      <div className="calculator-grid">
        <section>
          <h3>Assets</h3>
          <div className="form-group">
            <label htmlFor="cashInHand">Cash in Hand</label>
            <input id="cashInHand" type="number" value={assets.cashInHand || ''} onChange={handleAssetChange} placeholder="₹0" />
          </div>
          <div className="form-group">
            <label htmlFor="savingsAccount">Savings Account</label>
            <input id="savingsAccount" type="number" value={assets.savingsAccount || ''} onChange={handleAssetChange} placeholder="₹0" />
          </div>
          <div className="form-group">
            <label htmlFor="fixedDeposit">Fixed Deposit (FD)</label>
            <input id="fixedDeposit" type="number" value={assets.fixedDeposit || ''} onChange={handleAssetChange} placeholder="₹0" />
          </div>
          <div className="form-group">
            <label htmlFor="recurringDeposit">Recurring Deposit (RD)</label>
            <input id="recurringDeposit" type="number" value={assets.recurringDeposit || ''} onChange={handleAssetChange} placeholder="₹0" />
          </div>
          <div className="form-group">
            <label htmlFor="stocks">Stocks</label>
            <input id="stocks" type="number" value={assets.stocks || ''} onChange={handleAssetChange} placeholder="₹0" />
          </div>
          <div className="form-group">
            <label htmlFor="mutualFunds">Mutual Funds</label>
            <input id="mutualFunds" type="number" value={assets.mutualFunds || ''} onChange={handleAssetChange} placeholder="₹0" />
          </div>
           <div className="form-group">
            <label htmlFor="crypto">Cryptocurrency</label>
            <input id="crypto" type="number" value={assets.crypto || ''} onChange={handleAssetChange} placeholder="₹0" />
          </div>
          <div className="form-group">
            <label htmlFor="nps">NPS</label>
            <input id="nps" type="number" value={assets.nps || ''} onChange={handleAssetChange} placeholder="₹0" />
          </div>
          <div className="form-group">
            <label htmlFor="ppf">PPF</label>
            <input id="ppf" type="number" value={assets.ppf || ''} onChange={handleAssetChange} placeholder="₹0" />
          </div>
          <div className="form-group">
            <label htmlFor="pf">PF / EPF</label>
            <input id="pf" type="number" value={assets.pf || ''} onChange={handleAssetChange} placeholder="₹0" />
          </div>
           <div className="form-group">
            <label htmlFor="sukanyaSamriddhi">Sukanya Samriddhi</label>
            <input id="sukanyaSamriddhi" type="number" value={assets.sukanyaSamriddhi || ''} onChange={handleAssetChange} placeholder="₹0" />
          </div>
           <div className="form-group">
            <label htmlFor="gold">Gold & Jewellery</label>
            <input id="gold" type="number" value={assets.gold || ''} onChange={handleAssetChange} placeholder="₹0" />
          </div>
           <div className="form-group">
            <label htmlFor="house">House (Primary Residence)</label>
            <input id="house" type="number" value={assets.house || ''} onChange={handleAssetChange} placeholder="₹0" />
          </div>
           <div className="form-group">
            <label htmlFor="car">Car (Vehicle Value)</label>
            <input id="car" type="number" value={assets.car || ''} onChange={handleAssetChange} placeholder="₹0" />
          </div>
           <div className="form-group">
            <label htmlFor="otherProperty">Other Property</label>
            <input id="otherProperty" type="number" value={assets.otherProperty || ''} onChange={handleAssetChange} placeholder="₹0" />
          </div>
          <div className="form-group">
            <label htmlFor="other-assets">Other</label>
            <input id="other" name="other-assets" type="number" value={assets.other || ''} onChange={handleAssetChange} placeholder="₹0" />
          </div>
        </section>
        <section>
          <h3>Liabilities</h3>
          <div className="form-group">
            <label htmlFor="homeLoan">Home Loan</label>
            <input id="homeLoan" type="number" value={liabilities.homeLoan || ''} onChange={handleLiabilityChange} placeholder="₹0" />
          </div>
          <div className="form-group">
            <label htmlFor="personalLoan">Personal Loan</label>
            <input id="personalLoan" type="number" value={liabilities.personalLoan || ''} onChange={handleLiabilityChange} placeholder="₹0" />
          </div>
          <div className="form-group">
            <label htmlFor="carLoan">Car Loan</label>
            <input id="carLoan" type="number" value={liabilities.carLoan || ''} onChange={handleLiabilityChange} placeholder="₹0" />
          </div>
          <div className="form-group">
            <label htmlFor="creditCard">Credit Card Debt</label>
            <input id="creditCard" type="number" value={liabilities.creditCard || ''} onChange={handleLiabilityChange} placeholder="₹0" />
          </div>
          <div className="form-group">
            <label htmlFor="other-liabilities">Other</label>
            <input id="other" name="other-liabilities" type="number" value={liabilities.other || ''} onChange={handleLiabilityChange} placeholder="₹0" />
          </div>
        </section>
      </div>
      <button className="done-button" onClick={onClose}>Done</button>
    </div>
  );
};

export default NetWorthCalculator;
import React from 'react';

export default function LeaderboardItem({ rank, name, stats, type, maxRevenue }) {
  // stats: { gross, net, deductions } for products
  // stats: { gross, net } for sellers
  
  const mainStat = stats.gross; 
  const percentage = maxRevenue > 0 ? (mainStat / maxRevenue) * 100 : 0;
  
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  return (
    <div className={`leaderboard-item rank-${rank}`}>
      <div className="item-header">
        <div className="item-name">
          <div className="rank-badge">{rank}</div>
          {type === 'seller' && (
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%', 
              backgroundColor: 'var(--border-color)', display: 'flex', 
              alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
            }}>
              {name.charAt(0)}
            </div>
          )}
          <span>{name}</span>
        </div>
        
        <div className="item-stats">
          {type === 'product' && (
            <>
              <span className="stat-neutral">{formatter.format(stats.gross)}</span>
              <span className="stat-negative">-{formatter.format(stats.deductions)}</span>
              <span className="stat-positive">{formatter.format(stats.net)}</span>
            </>
          )}
          {type === 'seller' && (
            <span className="stat-positive">{formatter.format(stats.net)}</span>
          )}
        </div>
      </div>
      
      <div className="bar-container" style={{ marginTop: '0.5rem' }}>
        <div className="bar-fill" style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
}

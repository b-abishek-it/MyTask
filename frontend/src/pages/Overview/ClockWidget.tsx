import { useState, useEffect } from 'react';
import styles from './ClockWidget.module.css';

export const ClockWidget = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = time.getHours();
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();

  const secondDeg = seconds * 6;
  const minuteDeg = minutes * 6 + seconds * 0.1;
  const hourDeg = (hours % 12) * 30 + minutes * 0.5;

  const dateStr = time.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const timeStr = time.toLocaleTimeString('en-US', {
    hour12: true,
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit'
  });

  return (
    <div className={styles.widgetContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>Value of Time</h2>
      </div>
      <div className={styles.content}>
        <div className={styles.digitalDisplay}>
          <div className={styles.date}>{dateStr}</div>
          <div className={styles.time}>{timeStr}</div>
        </div>

        <div className={styles.clockContainer}>
          <div className={styles.clockFace}>
            <div className={styles.centerDot}></div>
            <div
              className={`${styles.hand} ${styles.hourHand}`}
              style={{ transform: `rotate(${hourDeg}deg)` }}
            ></div>
            <div
              className={`${styles.hand} ${styles.minuteHand}`}
              style={{ transform: `rotate(${minuteDeg}deg)` }}
            ></div>
            <div 
              className={`${styles.hand} ${styles.secondHand}`} 
              style={{ transform: `rotate(${secondDeg}deg)` }}
            ></div>
            
            {[...Array(60)].map((_, i) => (
              <div 
                key={i} 
                className={styles.tickWrapper} 
                style={{ transform: `rotate(${i * 6}deg)` }}
              >
                <div className={`${styles.tick} ${i % 5 === 0 ? styles.hourTick : styles.minuteTick}`}></div>
              </div>
            ))}
            
            <div className={`${styles.marker} ${styles.marker12}`}>12</div>
            <div className={`${styles.marker} ${styles.marker3}`}>3</div>
            <div className={`${styles.marker} ${styles.marker6}`}>6</div>
            <div className={`${styles.marker} ${styles.marker9}`}>9</div>
          </div>
        </div>
      </div>
    </div>
  );
};

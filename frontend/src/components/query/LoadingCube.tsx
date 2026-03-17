import React from 'react';
import styles from './LoadingCube.module.scss';

export default function LoadingCube() {
  const heights = [1, 2, 3];
  const widths = [1, 2, 3];
  const lengths = [1, 2, 3];

  return (
    <div className="w-full h-full flex flex-col items-center justify-center opacity-80 scale-150">
      <div className={styles.container}>
        {heights.map((h) => (
          <div key={`h${h}`}>
            {widths.map((w) =>
              lengths.map((l) => (
                <div key={`cube-${h}-${w}-${l}`} className={`${styles.cube} ${styles[`slice-${h}-${w}-${l}`]}`}>
                  <div className={`${styles.face} ${styles.top}`}></div>
                  <div className={`${styles.face} ${styles.left}`}></div>
                  <div className={`${styles.face} ${styles.right}`}></div>
                </div>
              ))
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

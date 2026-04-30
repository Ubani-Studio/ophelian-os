'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './landing.module.css';

const BRAND_NAMES = ['Bóveda'] as const;

export default function LandingPage() {
  const router = useRouter();
  const [brandIndex, setBrandIndex] = useState(0);

  const currentBrand = BRAND_NAMES[brandIndex];

  const cycleBrand = () => {
    setBrandIndex((prev) => (prev + 1) % BRAND_NAMES.length);
  };

  const handleEnter = () => {
    router.push('/operators');
  };

  return (
    <div className={styles.landing}>
      <div className={styles.content}>
        <h1 className={styles.brand} onClick={cycleBrand}>
          {currentBrand}
        </h1>
        <button className={styles.enter} onClick={handleEnter}>
          Enter
        </button>
      </div>
    </div>
  );
}

import React from 'react'
import styles from './Loader.module.css'

const Loader = () => {
    return (
        <svg viewBox="25 25 50 50" className={styles.container}>
            <circle cx="50" cy="50" r="20" className={styles.loader}></circle>
        </svg>


    );
}

export default Loader;

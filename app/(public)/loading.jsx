import Loader from '@/components/Loader/page';

export default function Loading() {
    return (
        <div
            className="bg-white dark:bg-[#09090b]"
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100vh',
                width: '100vw',
            }}
        >
            <Loader />
        </div>
    );
}

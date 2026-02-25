'use client';

import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function DeleteAssetButton({ assetId }: { assetId: string }) {
    const router = useRouter();
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this asset?')) return;
        setDeleting(true);
        const supabase = createClient();
        await supabase.from('assets').delete().eq('id', assetId);
        router.refresh();
    };

    return (
        <button
            onClick={handleDelete}
            disabled={deleting}
            style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                fontSize: '12px', fontWeight: 500, color: 'var(--danger)',
                background: 'transparent', border: 'none', cursor: 'pointer',
                padding: '4px 0', transition: 'opacity 0.2s',
                opacity: deleting ? 0.5 : 1,
            }}
        >
            <Trash2 style={{ width: 14, height: 14 }} /> {deleting ? 'Deleting…' : 'Delete Asset'}
        </button>
    );
}

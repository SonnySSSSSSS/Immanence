import React from 'react';
import { OrbCore } from './OrbCore';

export function VerificationGallery() {
    const stages = ['seedling', 'ember', 'flame', 'beacon', 'stellar'];
    const paths = ['soma', 'prana', 'dhyana', 'drishti', 'jnana', 'sakshi'];
    const vectors = ['ekagrata', 'sahaja', 'vigilance'];
    
    return (
        <div style={{ padding: '40px', background: '#f5f2e9', minHeight: '100vh', display: 'flex', flexDirection: 'column', gap: '60px', alignItems: 'center' }}>
            <div style={{ width: '100%', textAlign: 'center', marginBottom: '20px' }}>
                <h1 style={{ color: '#333', fontFamily: 'serif' }}>Jewel Authority: Final 90-Asset Matrix</h1>
                <p style={{ color: '#666' }}>Ekagrata (Left) | Sahaja (Center) | Vigilance (Right)</p>
                <div style={{ marginTop: '20px', padding: '15px', background: '#fff', border: '1px solid #ddd', borderRadius: '8px', display: 'inline-block' }}>
                    <strong>Blind Test Criteria:</strong> Silhouette must be identical. If you can see the vector from the outline alone, it is invalid.
                </div>
            </div>
            
            {stages.map(stage => (
                <div key={stage} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '30px' }}>
                    <h2 style={{ borderBottom: '2px solid #333', paddingBottom: '10px', color: '#333', textTransform: 'uppercase', letterSpacing: '2px' }}>{stage} Stage</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(800px, 1fr))', gap: '40px' }}>
                        {paths.map(path => (
                            <div key={`${stage}_${path}`} style={{ display: 'flex', flexDirection: 'column', gap: '15px', padding: '20px', background: '#fff', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                                <h3 style={{ margin: 0, color: '#555', fontFamily: 'serif' }}>{path.toUpperCase()} Path</h3>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px' }}>
                                    {vectors.map(vector => (
                                        <div key={vector} style={{ textAlign: 'center', flex: 1 }}>
                                            <div style={{ fontSize: '10px', color: '#aaa', textTransform: 'uppercase', marginBottom: '10px' }}>{vector}</div>
                                            <div style={{ position: 'relative', width: '220px', height: '220px', margin: '0 auto', border: '1px solid #f0f0f0', borderRadius: '4px' }}>
                                                <OrbCore 
                                                    variantProps={{ gemSrc: `${import.meta.env.BASE_URL}avatars/${stage}_${path}_${vector}.png` }} 
                                                    stage={stage} 
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

import { OrganizationDataSeeder, seedOrganizationsWithAuth } from './OrganizationDataSeeder.js';
import { medplumClient } from '../../lib/medplum/client.js';

// Node.js utility functions for organization seeding
export async function runOrganizationSeeding(options?: {
    token?: string;
    useStoredAuth?: boolean;
    email?: string;
    password?: string;
}) {
    console.log('🏥 Starting Mali Healthcare Organizations Seeding');
    console.log('📍 Target: Community Health Centers, Regional Hospitals, and National Hospitals');
    
    try {
        if (!medplumClient) {
            throw new Error('Medplum client not available');
        }

        const result = await seedOrganizationsWithAuth(medplumClient, {
            token: options?.token,
            useStoredAuth: options?.useStoredAuth,
            email: options?.email,
            password: options?.password
        });

        console.log('\n✅ Organization Seeding Complete!');
        console.log(`📊 Created ${result.allOrganizations.length} total organizations:`);
        console.log(`   • ${result.nationalHospitals.length} National Hospitals`);
        console.log(`   • ${result.regionalHospitals.length} Regional Hospitals`);
        console.log(`   • ${result.referralCenters.length} Referral Centers (CSRef)`);
        console.log(`   • ${result.communityHealthCenters.length} Community Health Centers (CSCom)`);

        return result;

    } catch (error: any) {
        console.error('❌ Organization seeding failed:', error);
        
        if (error.message?.includes('Authentication')) {
            console.log('\n🔑 Authentication Help:');
            console.log('   • Login to the application first');
            console.log('   • Or provide a valid token: runOrganizationSeeding({ token: "your-token" })');
            console.log('   • Or use email/password: runOrganizationSeeding({ email: "user@example.com", password: "password" })');
        }
        
        throw error;
    }
}

// Utility function to verify organization seeding
export async function verifyOrganizationSeeding() {
    console.log('🔍 Verifying organization seeding...');
    
    try {
        if (!medplumClient) {
            throw new Error('Medplum client not available');
        }

        // Search for seeded organizations
        const organizations = await medplumClient.search('Organization', {
            _count: 100,
            active: 'true'
        });

        const nationalHospitals = organizations.filter(org => 
            org.name?.includes('Point G') || 
            org.name?.includes('Gabriel Touré') || 
            org.name?.includes('Kati')
        );
        
        const regionalHospitals = organizations.filter(org => 
            org.name?.includes('Hôpital Régional')
        );
        
        const referralCenters = organizations.filter(org => 
            org.name?.includes('Centre de Santé de Référence')
        );
        
        const communityHealthCenters = organizations.filter(org => 
            org.name?.includes('Centre de Santé Communautaire')
        );

        console.log('\n📊 Organization Verification Results:');
        console.log(`   • Total Organizations: ${organizations.length}`);
        console.log(`   • National Hospitals: ${nationalHospitals.length}`);
        console.log(`   • Regional Hospitals: ${regionalHospitals.length}`);
        console.log(`   • Referral Centers: ${referralCenters.length}`);
        console.log(`   • Community Health Centers: ${communityHealthCenters.length}`);

        return {
            total: organizations.length,
            nationalHospitals: nationalHospitals.length,
            regionalHospitals: regionalHospitals.length,
            referralCenters: referralCenters.length,
            communityHealthCenters: communityHealthCenters.length,
            organizations
        };

    } catch (error: any) {
        console.error('❌ Verification failed:', error);
        throw error;
    }
}

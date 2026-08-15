/**
 * Ads Push CMS - Application Logic
 */

// --- Data Layer ---
let ads = [];

const API = {
    // Cloudflare integration points would be here
    // Example: return fetch('https://api.yourworker.com/ads').then(r => r.json());
    
    async loadInitialData() {
        const stored = localStorage.getItem('ads_push_data');
        if (stored) {
            ads = JSON.parse(stored);
        } else {
            try {
                const response = await fetch('ads.json');
                const data = await response.json();
                ads = data.ads;
                this.saveToStorage();
            } catch (err) {
                console.warn("ads.json not found, starting with empty state.");
                ads = [];
            }
        }
        renderDashboard();
        renderAdsTable();
    },

    saveToStorage() {
        localStorage.setItem('ads_push_data', JSON.stringify(ads));
    }
};

// --- DOM Elements ---
const views = document.querySelectorAll('.view');
const navLinks = document.querySelectorAll('.sidebar-nav a');
const adsBody = document.getElementById('ads-body');
const adModal = document.getElementById('ad-modal');
const adForm = document.getElementById('ad-form');
const mediaPreview = document.getElementById('media-preview');

// --- Navigation Logic ---
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetView = link.getAttribute('data-view');
        
        // Update UI
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        
        views.forEach(v => v.classList.add('hidden'));
        document.getElementById(`${targetView}-view`).classList.remove('hidden');
        document.getElementById('page-title').innerText = link.innerText;

        if (targetView === 'ads') renderAdsTable();
        if (targetView === 'dashboard') renderDashboard();
    });
});

// --- Dashboard Logic ---
function renderDashboard() {
    const total = ads.length;
    const active = ads.filter(a => a.status === 'active').length;
    const imps = ads.reduce((sum, a) => sum + (a.impressions || 0), 0);
    const clicks = ads.reduce((sum, a) => sum + (a.clicks || 0), 0);
    const ctr = imps > 0 ? ((clicks / imps) * 100).toFixed(2) : 0;

    document.getElementById('stat-total-ads').innerText = total;
    document.getElementById('stat-active-ads').innerText = active;
    document.getElementById('stat-impressions').innerText = imps.toLocaleString();
    document.getElementById('stat-ctr').innerText = `${ctr}%`;
    document.getElementById('current-date').innerText = new Date().toLocaleDateString();
}

// --- Ads Management Logic ---
function renderAdsTable(data = ads) {
    adsBody.innerHTML = '';
    
    data.forEach(ad => {
        const tr = document.createElement('tr');
        const ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(1) : 0;
        
        tr.innerHTML = `
            <td>
                ${ad.type === 'image' 
                    ? `<img src="${ad.mediaUrl}" class="ad-thumb" onerror="this.src='https://via.placeholder.com/60x40?text=Error'">`
                    : `<video src="${ad.mediaUrl}" class="ad-thumb"></video>`
                }
            </td>
            <td>
                <strong>${ad.title}</strong><br>
                <small class="text-muted">${ad.campaign}</small>
            </td>
            <td><i class="fas fa-${ad.type === 'image' ? 'image' : 'video'}"></i> ${ad.type}</td>
            <td>
                <small>${ad.startDate || 'No start'}<br>${ad.endDate || 'No end'}</small>
            </td>
            <td><span class="badge">${ad.priority}</span></td>
            <td><span class="status-badge status-${ad.status}">${ad.status}</span></td>
            <td>
                <small>${ad.impressions.toLocaleString()} Imps<br>${ctr}% CTR</small>
            </td>
            <td>
                <div class="filters">
                    <button class="btn-icon" onclick="editAd(${ad.id})" title="Edit"><i class="fas fa-edit"></i></button>
                    <button class="btn-icon" onclick="toggleStatus(${ad.id})" title="Toggle Status"><i class="fas fa-power-off"></i></button>
                    <button class="btn-icon text-danger" onclick="deleteAd(${ad.id})" title="Delete"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        `;
        adsBody.appendChild(tr);
    });
}

// Search & Filter
document.getElementById('ad-search').addEventListener('input', filterAds);
document.getElementById('filter-type').addEventListener('change', filterAds);
document.getElementById('filter-status').addEventListener('change', filterAds);

function filterAds() {
    const searchTerm = document.getElementById('ad-search').value.toLowerCase();
    const typeFilter = document.getElementById('filter-type').value;
    const statusFilter = document.getElementById('filter-status').value;

    const filtered = ads.filter(ad => {
        const matchesSearch = ad.title.toLowerCase().includes(searchTerm) || ad.campaign.toLowerCase().includes(searchTerm);
        const matchesType = typeFilter === 'all' || ad.type === typeFilter;
        const matchesStatus = statusFilter === 'all' || ad.status === statusFilter;
        return matchesSearch && matchesType && matchesStatus;
    });

    renderAdsTable(filtered);
}

// --- Modal & Form Logic ---
document.getElementById('btn-add-ad').addEventListener('click', () => openModal());

function openModal(ad = null) {
    adForm.reset();
    document.getElementById('ad-id').value = ad ? ad.id : '';
    document.getElementById('modal-title').innerText = ad ? 'Edit Ad' : 'Create New Ad';
    
    if (ad) {
        document.getElementById('title').value = ad.title;
        document.getElementById('campaign').value = ad.campaign;
        document.getElementById('type').value = ad.type;
        document.getElementById('mediaUrl').value = ad.mediaUrl;
        document.getElementById('posterUrl').value = ad.posterUrl;
        document.getElementById('destinationUrl').value = ad.destinationUrl;
        document.getElementById('cta').value = ad.cta;
        document.getElementById('status').value = ad.status;
        document.getElementById('startDate').value = ad.startDate;
        document.getElementById('endDate').value = ad.endDate;
        document.getElementById('priority').value = ad.priority;
        document.getElementById('description').value = ad.description;
        updatePreview();
    }
    
    adModal.style.display = 'flex';
}

document.querySelectorAll('.close-modal').forEach(el => {
    el.addEventListener('click', () => adModal.style.display = 'none');
});

// Real-time Preview
document.getElementById('mediaUrl').addEventListener('input', updatePreview);
document.getElementById('type').addEventListener('change', updatePreview);

function updatePreview() {
    const url = document.getElementById('mediaUrl').value;
    const type = document.getElementById('type').value;
    const poster = document.getElementById('posterUrl').value;

    if (!url) {
        mediaPreview.innerHTML = '<p>Enter Media URL to see preview</p>';
        return;
    }

    if (type === 'image') {
        mediaPreview.innerHTML = `<img src="${url}" onerror="this.parentElement.innerHTML='Invalid Image URL'">`;
    } else {
        mediaPreview.innerHTML = `<video src="${url}" poster="${poster}" controls muted></video>`;
    }
}

// Form Submit (Create/Update)
adForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const id = document.getElementById('ad-id').value;
    const adData = {
        id: id ? parseInt(id) : Date.now(),
        title: document.getElementById('title').value,
        campaign: document.getElementById('campaign').value,
        type: document.getElementById('type').value,
        mediaUrl: document.getElementById('mediaUrl').value,
        posterUrl: document.getElementById('posterUrl').value,
        destinationUrl: document.getElementById('destinationUrl').value,
        cta: document.getElementById('cta').value,
        status: document.getElementById('status').value,
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value,
        priority: parseInt(document.getElementById('priority').value),
        description: document.getElementById('description').value,
        impressions: id ? ads.find(a => a.id == id).impressions : 0,
        clicks: id ? ads.find(a => a.id == id).clicks : 0,
        createdAt: id ? ads.find(a => a.id == id).createdAt : new Date().toISOString().split('T')[0]
    };

    if (id) {
        const index = ads.findIndex(a => a.id == id);
        ads[index] = adData;
    } else {
        ads.push(adData);
    }

    API.saveToStorage();
    adModal.style.display = 'none';
    renderAdsTable();
    renderDashboard();
});

// --- Actions ---
window.editAd = (id) => {
    const ad = ads.find(a => a.id === id);
    openModal(ad);
};

window.deleteAd = (id) => {
    if (confirm('Are you sure you want to delete this ad?')) {
        ads = ads.filter(a => a.id !== id);
        API.saveToStorage();
        renderAdsTable();
        renderDashboard();
    }
};

window.toggleStatus = (id) => {
    const ad = ads.find(a => a.id === id);
    ad.status = ad.status === 'active' ? 'paused' : 'active';
    API.saveToStorage();
    renderAdsTable();
    renderDashboard();
};

// --- Init ---
API.loadInitialData();

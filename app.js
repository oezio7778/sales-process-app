// Data Storage (using Supabase for cloud persistence)
const storage = {
    get: async (table) => {
        const { data, error } = await supabase.from(table).select('*').order('id', { ascending: false });
        if (error) {
            console.error(`Error fetching ${table}:`, error);
            return [];
        }
        return data || [];
    },
    set: async (table, items) => {
        // For bulk updates - delete all and reinsert
        const { error: deleteError } = await supabase.from(table).delete().neq('id', 0);
        if (deleteError) console.error(`Error clearing ${table}:`, deleteError);

        const { error: insertError } = await supabase.from(table).insert(items);
        if (insertError) console.error(`Error inserting ${table}:`, insertError);
        return !insertError;
    },
    add: async (table, item) => {
        const newItem = { ...item, created_at: new Date().toISOString() };
        const { data, error } = await supabase.from(table).insert(newItem).select().single();
        if (error) {
            console.error(`Error adding to ${table}:`, error);
            return null;
        }
        return data;
    },
    update: async (table, id, updates) => {
        const { data, error } = await supabase.from(table).update(updates).eq('id', id).select().single();
        if (error) {
            console.error(`Error updating ${table}:`, error);
            return null;
        }
        return data;
    },
    delete: async (table, id) => {
        const { error } = await supabase.from(table).delete().eq('id', id);
        if (error) {
            console.error(`Error deleting from ${table}:`, error);
            return false;
        }
        return true;
    }
};

// Data cache for synchronous access
const dataCache = {
    deals: [],
    meetings: [],
    order_sessions: [],
    stakeholders: [],
    roi_scenarios: [],
    service_offerings: [],
    sow_templates: [],
    sows: [],
    quotes: [],
    workflows: []
};

// Sync data from Supabase to cache
async function syncFromSupabase(table) {
    const data = await db.get(table);
    dataCache[table] = data;
    return data;
}

// Sync all tables
async function syncAllData() {
    await Promise.all([
        syncFromSupabase('deals'),
        syncFromSupabase('meetings'),
        syncFromSupabase('order_sessions'),
        syncFromSupabase('stakeholders'),
        syncFromSupabase('roi_scenarios'),
        syncFromSupabase('service_offerings'),
        syncFromSupabase('sow_templates'),
        syncFromSupabase('sows'),
        syncFromSupabase('quotes'),
        syncFromSupabase('workflows')
    ]);
}

// Hybrid storage - uses cache for reads, Supabase for writes
const db = {
    get: (table) => dataCache[table] || [],
    add: async (table, item) => {
        const result = await storage.add(table, item);
        if (result) {
            await syncFromSupabase(table);
        }
        return result;
    },
    update: async (table, id, updates) => {
        const result = await storage.update(table, id, updates);
        if (result) {
            await syncFromSupabase(table);
        }
        return result;
    },
    delete: async (table, id) => {
        const result = await storage.delete(table, id);
        if (result) {
            await syncFromSupabase(table);
        }
        return result;
    }
};

// Current Deal Management
let currentDeal = localStorage.getItem('currentDealId') ? parseInt(localStorage.getItem('currentDealId')) : null;

function setCurrentDeal(dealId) {
    currentDeal = dealId;
    localStorage.setItem('currentDealId', dealId);
    loadDealSelector();
    updateDashboard();
    autoPopulateForms();
}

function getCurrentDeal() {
    if (!currentDeal) return null;
    const deals = db.get('deals');
    return deals.find(d => d.id === currentDeal);
}

// Auto-populate forms with deal data
function autoPopulateForms() {
    const deal = getCurrentDeal();

    // Pre-Call Prep
    const researchCompany = document.getElementById('researchCompany');
    const researchLeader = document.getElementById('researchLeader');

    // Meeting Notes
    const meetingCompany = document.getElementById('meetingCompany');

    // Quote Builder
    const quoteClient = document.getElementById('quoteClient');

    if (!deal) {
        // Clear all fields if no deal selected
        if (researchCompany) researchCompany.value = '';
        if (researchLeader) researchLeader.value = '';
        if (meetingCompany) meetingCompany.value = '';
        if (quoteClient) quoteClient.value = '';
        return;
    }

    // Always update with current deal info (even if field has value)
    if (researchCompany) {
        researchCompany.value = deal.companyName || '';
    }
    if (researchLeader) {
        researchLeader.value = deal.contactName || '';
    }
    if (meetingCompany) {
        meetingCompany.value = deal.companyName || '';
    }
    if (quoteClient) {
        quoteClient.value = deal.companyName || '';
    }
}

// Load Deal Selector
function loadDealSelector() {
    const deals = db.get('deals');
    const selector = document.getElementById('dealSelector');

    selector.innerHTML = '<option value="">Select or create a deal...</option>' +
        deals.map(deal => `<option value="${deal.id}" ${deal.id === currentDeal ? 'selected' : ''}>${deal.companyName} - ${deal.contactName || 'No contact'}</option>`).join('');
}

// Deal Selector Change
document.getElementById('dealSelector')?.addEventListener('change', (e) => {
    const dealId = parseInt(e.target.value);
    if (dealId) {
        setCurrentDeal(dealId);
    }
});

// New Deal Button
document.getElementById('newDealBtn')?.addEventListener('click', () => {
    showNewDealModal();
});

function showNewDealModal() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal">
            <div class="modal-header">
                <h3>Create New Deal</h3>
                <button class="modal-close">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div class="modal-body">
                <form id="newDealForm" class="form">
                    <div class="form-group">
                        <label for="dealCompanyName">Company Name *</label>
                        <input type="text" id="dealCompanyName" required>
                    </div>
                    <div class="form-group">
                        <label for="dealContactName">Primary Contact</label>
                        <input type="text" id="dealContactName">
                    </div>
                    <div class="form-group">
                        <label for="dealContactEmail">Contact Email</label>
                        <input type="email" id="dealContactEmail">
                    </div>
                    <div class="form-group">
                        <label for="dealValue">Estimated Deal Value ($)</label>
                        <input type="number" id="dealValue" min="0" step="1000">
                    </div>
                    <div class="form-group">
                        <label for="dealStage">Deal Stage</label>
                        <select id="dealStage">
                            <option value="prospecting">Prospecting</option>
                            <option value="qualification">Qualification</option>
                            <option value="proposal">Proposal</option>
                            <option value="negotiation">Negotiation</option>
                            <option value="closed-won">Closed Won</option>
                            <option value="closed-lost">Closed Lost</option>
                        </select>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary modal-cancel">Cancel</button>
                <button class="btn btn-primary modal-submit">Create Deal</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Close modal handlers
    modal.querySelector('.modal-close').addEventListener('click', () => modal.remove());
    modal.querySelector('.modal-cancel').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });

    // Submit handler
    modal.querySelector('.modal-submit').addEventListener('click', async () => {
        const form = document.getElementById('newDealForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const deal = {
            company_name: document.getElementById('dealCompanyName').value,
            contact_name: document.getElementById('dealContactName').value,
            contact_email: document.getElementById('dealContactEmail').value,
            value: parseFloat(document.getElementById('dealValue').value) || 0,
            stage: document.getElementById('dealStage').value
        };

        const newDeal = await db.add('deals', deal);
        setCurrentDeal(newDeal.id);
        modal.remove();

        alert(`Deal created for ${deal.companyName}! All your notes and activities will now be linked to this deal.`);
    });
}

// Navigation
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        const page = item.dataset.page;

        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');

        // Show corresponding page
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.getElementById(page).classList.add('active');

        // Refresh data for specific pages
        if (page === 'dashboard') updateDashboard();
        if (page === 'sow') loadMeetingsForSow();
        if (page === 'workflow') loadWorkflows();
    });
});

// Dashboard Updates
function updateDashboard() {
    if (!currentDeal) {
        document.getElementById('activeMeetings').textContent = '0';
        document.getElementById('pendingSows').textContent = '0';
        document.getElementById('openQuotes').textContent = '0';
        document.getElementById('activeWorkflows').textContent = '0';

        const activityList = document.getElementById('activityList');
        activityList.innerHTML = '<div class="empty-state"><p>Select or create a deal to see activity.</p></div>';
        return;
    }

    const meetings = db.get('meetings').filter(m => m.dealId === currentDeal);
    const sows = db.get('sows').filter(s => s.dealId === currentDeal);
    const quotes = db.get('quotes').filter(q => q.dealId === currentDeal);
    const workflows = db.get('workflows').filter(w => w.dealId === currentDeal);

    document.getElementById('activeMeetings').textContent = meetings.length;
    document.getElementById('pendingSows').textContent = sows.length;
    document.getElementById('openQuotes').textContent = quotes.length;
    document.getElementById('activeWorkflows').textContent = workflows.filter(w => w.status !== 'completed').length;

    // Show recent activity for this deal
    const activityList = document.getElementById('activityList');
    const allActivity = [
        ...meetings.map(m => ({ type: 'meeting', data: m })),
        ...quotes.map(q => ({ type: 'quote', data: q })),
        ...sows.map(s => ({ type: 'sow', data: s }))
    ].sort((a, b) => new Date(b.data.createdAt) - new Date(a.data.createdAt)).slice(0, 5);

    if (allActivity.length === 0) {
        activityList.innerHTML = '<div class="empty-state"><p>No recent activity for this deal. Start by preparing for a meeting!</p></div>';
    } else {
        activityList.innerHTML = allActivity.map(activity => {
            const { type, data } = activity;
            const date = new Date(data.createdAt).toLocaleDateString();
            let title = '';

            if (type === 'meeting') title = `Meeting with ${data.company}`;
            if (type === 'quote') title = `Quote for ${data.client}`;
            if (type === 'sow') title = `SoW generated for ${data.company}`;

            return `
                <div class="list-item">
                    <h4>${title}</h4>
                    <p>${date}</p>
                </div>
            `;
        }).join('');
    }
}

// Meeting Preparation / Research
document.getElementById('researchForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const company = document.getElementById('companyName').value;
    const leader = document.getElementById('leaderName').value;

    const resultsDiv = document.getElementById('researchResults');
    const contentDiv = document.getElementById('researchContent');

    resultsDiv.classList.remove('hidden');
    contentDiv.innerHTML = '<p>🔍 Researching...</p>';

    // Simulate AI research (in production, this would call an API)
    setTimeout(() => {
        const mockResearch = `
            <h4>Company: ${company}</h4>
            <p><strong>Industry:</strong> Technology / SaaS</p>
            <p><strong>Size:</strong> 50-200 employees</p>
            <p><strong>Recent News:</strong> Announced Series B funding round</p>
            <p><strong>Key Challenges:</strong> Scaling infrastructure, improving customer onboarding</p>
            ${leader ? `
                <h4 style="margin-top: 1.5rem;">Leader: ${leader}</h4>
                <p><strong>Role:</strong> Chief Technology Officer</p>
                <p><strong>Background:</strong> 10+ years in enterprise software</p>
                <p><strong>LinkedIn:</strong> Active on platform, posts about cloud architecture</p>
            ` : ''}
            <h4 style="margin-top: 1.5rem;">Talking Points:</h4>
            <ul style="margin-left: 1.5rem; margin-top: 0.5rem;">
                <li>Discuss scalability solutions for rapid growth</li>
                <li>Highlight experience with similar-sized companies</li>
                <li>Focus on ROI and time-to-value</li>
            </ul>
        `;

        contentDiv.innerHTML = mockResearch;

        // Save research
        await db.add('research', { company, leader, results: mockResearch });
    }, 1500);
});

// Meeting Notes
document.getElementById('meetingForm').addEventListener('submit', (e) => {
    e.preventDefault();

    if (!currentDeal) {
        alert('Please select or create a deal first!');
        return;
    }

    const meeting = {
        dealId: currentDeal,
        company: document.getElementById('meetingCompany').value,
        date: document.getElementById('meetingDate').value,
        notes: document.getElementById('meetingNotes').value
    };

    await db.add('meetings', meeting);

    // Reset form
    e.target.reset();

    // Show success
    alert('Meeting notes saved successfully!');

    // Refresh meetings list
    loadMeetingsList();
    updateDashboard();
});

function loadMeetingsList() {
    const meetings = db.get('meetings').filter(m => m.dealId === currentDeal);
    const listDiv = document.getElementById('meetingsList');

    if (!currentDeal) {
        listDiv.innerHTML = '<div class="empty-state"><p>Please select or create a deal to view meetings.</p></div>';
        return;
    }

    if (meetings.length === 0) {
        listDiv.innerHTML = '<div class="empty-state"><p>No meetings recorded for this deal yet.</p></div>';
    } else {
        listDiv.innerHTML = meetings.reverse().map(meeting => `
            <div class="list-item">
                <h4>${meeting.company}</h4>
                <p><strong>Date:</strong> ${new Date(meeting.date).toLocaleDateString()}</p>
                <p style="margin-top: 0.5rem;">${meeting.notes.substring(0, 150)}${meeting.notes.length > 150 ? '...' : ''}</p>
            </div>
        `).join('');
    }
}

// SoW Generator
function loadMeetingsForSow() {
    const meetings = db.get('meetings').filter(m => m.dealId === currentDeal);
    const select = document.getElementById('sowMeeting');

    if (!currentDeal) {
        select.innerHTML = '<option value="">Please select a deal first...</option>';
        return;
    }

    select.innerHTML = '<option value="">Choose a meeting...</option>' +
        meetings.map(m => `<option value="${m.id}">${m.company} - ${new Date(m.date).toLocaleDateString()}</option>`).join('');

    select.addEventListener('change', () => {
        document.getElementById('generateSow').disabled = !select.value;
    });
}

document.getElementById('generateSow').addEventListener('click', () => {
    const meetingId = parseInt(document.getElementById('sowMeeting').value);
    const meetings = db.get('meetings');
    const meeting = meetings.find(m => m.id === meetingId);

    if (!meeting) return;

    const outputDiv = document.getElementById('sowOutput');
    const contentDiv = document.getElementById('sowContent');

    outputDiv.classList.remove('hidden');
    contentDiv.innerHTML = 'Generating SoW with AI...';

    // Simulate AI SoW generation
    setTimeout(() => {
        const sow = `STATEMENT OF WORK
${meeting.company}

PROJECT OVERVIEW
Based on our meeting on ${new Date(meeting.date).toLocaleDateString()}, this Statement of Work outlines the proposed engagement.

SCOPE OF WORK
1. Discovery & Planning Phase (2 weeks)
   - Requirements gathering
   - Technical architecture design
   - Project timeline development

2. Implementation Phase (8 weeks)
   - Core platform development
   - Integration with existing systems
   - Quality assurance testing

3. Deployment & Training (2 weeks)
   - Production deployment
   - Team training sessions
   - Documentation delivery

DELIVERABLES
- Technical architecture document
- Fully functional platform
- User documentation
- Training materials
- 30 days post-launch support

TIMELINE
Total Duration: 12 weeks
Start Date: TBD
Estimated Completion: TBD

NEXT STEPS
1. Review and approve this SoW
2. Schedule kickoff meeting
3. Finalize contract and payment terms
4. Begin discovery phase

INVESTMENT
See attached quote for detailed pricing breakdown.`;

        contentDiv.textContent = sow;

        // Save SoW
        const savedSow = await db.add('sows', {
            dealId: currentDeal,
            company: meeting.company,
            meetingId: meeting.id,
            content: sow
        });

        // Store current SoW ID for quote creation
        document.getElementById('createQuote').dataset.sowId = savedSow.id;

        updateDashboard();
    }, 2000);
});

document.getElementById('editSow').addEventListener('click', () => {
    const contentDiv = document.getElementById('sowContent');
    const currentContent = contentDiv.textContent;

    contentDiv.innerHTML = `<textarea style="width: 100%; min-height: 400px; background: var(--dark); color: var(--text); border: 1px solid var(--border); border-radius: 0.5rem; padding: 1rem; font-family: monospace;">${currentContent}</textarea>`;

    const textarea = contentDiv.querySelector('textarea');
    textarea.focus();

    document.getElementById('editSow').textContent = 'Save Changes';
    document.getElementById('editSow').onclick = () => {
        contentDiv.textContent = textarea.value;
        document.getElementById('editSow').textContent = 'Edit SoW';
        document.getElementById('editSow').onclick = null;
        location.reload(); // Reset event listener
    };
});

document.getElementById('createQuote').addEventListener('click', () => {
    // Navigate to quotes page
    document.querySelector('[data-page="quotes"]').click();

    // Pre-fill client name from SoW
    const sowId = parseInt(document.getElementById('createQuote').dataset.sowId);
    const sows = db.get('sows');
    const sow = sows.find(s => s.id === sowId);

    if (sow) {
        document.getElementById('quoteClient').value = sow.company;
    }
});

// Quote Builder
let quoteItemCount = 1;

document.getElementById('addItem').addEventListener('click', () => {
    quoteItemCount++;
    const itemsDiv = document.getElementById('quoteItems');
    const newItem = document.createElement('div');
    newItem.className = 'quote-item';
    newItem.innerHTML = `
        <input type="text" placeholder="Item description" class="item-desc" required>
        <input type="number" placeholder="Cost" class="item-cost" min="0" step="0.01" required>
        <input type="number" placeholder="Price" class="item-price" min="0" step="0.01" required>
        <button type="button" class="btn-icon remove-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
    `;
    itemsDiv.appendChild(newItem);

    // Add remove functionality
    newItem.querySelector('.remove-item').addEventListener('click', () => {
        newItem.remove();
        quoteItemCount--;
        updateQuoteTotals();
    });

    // Add calculation listeners
    newItem.querySelectorAll('.item-cost, .item-price').forEach(input => {
        input.addEventListener('input', updateQuoteTotals);
    });
});

function updateQuoteTotals() {
    let totalCost = 0;
    let totalPrice = 0;

    document.querySelectorAll('.quote-item').forEach(item => {
        const cost = parseFloat(item.querySelector('.item-cost').value) || 0;
        const price = parseFloat(item.querySelector('.item-price').value) || 0;
        totalCost += cost;
        totalPrice += price;
    });

    const profit = totalPrice - totalCost;
    const margin = totalPrice > 0 ? ((profit / totalPrice) * 100).toFixed(1) : 0;

    document.getElementById('totalCost').textContent = `$${totalCost.toFixed(2)}`;
    document.getElementById('totalPrice').textContent = `$${totalPrice.toFixed(2)}`;
    document.getElementById('profitMargin').textContent = `${margin}% ($${profit.toFixed(2)})`;
}

// Add listeners to initial quote item
document.querySelectorAll('.item-cost, .item-price').forEach(input => {
    input.addEventListener('input', updateQuoteTotals);
});

document.getElementById('quoteForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const client = document.getElementById('quoteClient').value;
    const items = [];

    document.querySelectorAll('.quote-item').forEach(item => {
        items.push({
            description: item.querySelector('.item-desc').value,
            cost: parseFloat(item.querySelector('.item-cost').value),
            price: parseFloat(item.querySelector('.item-price').value)
        });
    });

    const totalCost = items.reduce((sum, item) => sum + item.cost, 0);
    const totalPrice = items.reduce((sum, item) => sum + item.price, 0);
    const profit = totalPrice - totalCost;
    const margin = ((profit / totalPrice) * 100).toFixed(1);

    if (!currentDeal) {
        alert('Please select or create a deal first!');
        return;
    }

    const quote = await db.add('quotes', {
        dealId: currentDeal,
        client,
        items,
        totalCost,
        totalPrice,
        profit,
        margin,
        status: 'pending'
    });

    // Create workflow
    await db.add('workflows', {
        dealId: currentDeal,
        quoteId: quote.id,
        client,
        status: 'pending_signature',
        steps: [
            { name: 'Quote Sent', completed: true, date: new Date().toISOString() },
            { name: 'Signature Received', completed: false },
            { name: 'Routed to AR', completed: false },
            { name: 'Routed to Engineers', completed: false },
            { name: '50% Down Payment', completed: false },
            { name: 'Project Kickoff', completed: false }
        ]
    });

    alert('Quote generated successfully! Check the Workflow page to track progress.');

    loadQuotesList();
    updateDashboard();

    // Reset form
    e.target.reset();
    document.getElementById('quoteItems').innerHTML = `
        <div class="quote-item">
            <input type="text" placeholder="Item description" class="item-desc" required>
            <input type="number" placeholder="Cost" class="item-cost" min="0" step="0.01" required>
            <input type="number" placeholder="Price" class="item-price" min="0" step="0.01" required>
            <button type="button" class="btn-icon remove-item" disabled>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
    `;
    quoteItemCount = 1;
    updateQuoteTotals();
});

function loadQuotesList() {
    const quotes = db.get('quotes').filter(q => q.dealId === currentDeal);
    const listDiv = document.getElementById('quotesList');

    if (!currentDeal) {
        listDiv.innerHTML = '<div class="empty-state"><p>Please select a deal to view quotes.</p></div>';
        return;
    }

    if (quotes.length === 0) {
        listDiv.innerHTML = '<div class="empty-state"><p>No quotes generated for this deal yet.</p></div>';
    } else {
        listDiv.innerHTML = quotes.reverse().map(quote => `
            <div class="list-item">
                <h4>${quote.client}</h4>
                <p><strong>Total:</strong> $${quote.totalPrice.toFixed(2)}</p>
                <p><strong>Profit Margin:</strong> ${quote.margin}%</p>
                <p><strong>Status:</strong> <span class="status-badge ${quote.status}">${quote.status}</span></p>
                <p style="margin-top: 0.5rem; font-size: 0.875rem;">${quote.items.length} items - Created ${new Date(quote.createdAt).toLocaleDateString()}</p>
            </div>
        `).join('');
    }
}

// Workflow Tracker
function loadWorkflows() {
    const workflows = db.get('workflows').filter(w => w.dealId === currentDeal);
    const listDiv = document.getElementById('workflowList');

    if (!currentDeal) {
        listDiv.innerHTML = '<div class="empty-state"><p>Please select a deal to view workflows.</p></div>';
        return;
    }

    if (workflows.length === 0) {
        listDiv.innerHTML = '<div class="empty-state"><p>No active workflows. Create a quote to start a workflow.</p></div>';
    } else {
        listDiv.innerHTML = workflows.reverse().map(workflow => {
            const completedSteps = workflow.steps.filter(s => s.completed).length;
            const totalSteps = workflow.steps.length;
            const progress = ((completedSteps / totalSteps) * 100).toFixed(0);

            return `
                <div class="card">
                    <h3>${workflow.client}</h3>
                    <div class="workflow-status">
                        <span class="status-badge ${workflow.status.replace('_', '-')}">${workflow.status.replace('_', ' ')}</span>
                        <span style="margin-left: auto; color: var(--text-muted);">${progress}% Complete</span>
                    </div>
                    <div style="margin-top: 1.5rem;">
                        ${workflow.steps.map(step => `
                            <div style="display: flex; align-items: center; gap: 1rem; padding: 0.75rem 0; border-bottom: 1px solid var(--border);">
                                <div style="width: 24px; height: 24px; border-radius: 50%; background: ${step.completed ? 'var(--success)' : 'var(--dark)'}; border: 2px solid ${step.completed ? 'var(--success)' : 'var(--border)'}; display: flex; align-items: center; justify-content: center;">
                                    ${step.completed ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>' : ''}
                                </div>
                                <div style="flex: 1;">
                                    <p style="font-weight: 500; color: ${step.completed ? 'var(--text)' : 'var(--text-muted)'};">${step.name}</p>
                                    ${step.date ? `<p style="font-size: 0.75rem; color: var(--text-muted);">${new Date(step.date).toLocaleDateString()}</p>` : ''}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <button class="btn btn-primary" style="margin-top: 1.5rem;" onclick="advanceWorkflow(${workflow.id})">
                        Complete Next Step
                    </button>
                </div>
            `;
        }).join('');
    }
}

function advanceWorkflow(workflowId) {
    const workflows = db.get('workflows');
    const workflow = workflows.find(w => w.id === workflowId);

    if (!workflow) return;

    const nextStep = workflow.steps.find(s => !s.completed);
    if (nextStep) {
        nextStep.completed = true;
        nextStep.date = new Date().toISOString();

        // Update status based on progress
        const completedSteps = workflow.steps.filter(s => s.completed).length;
        if (completedSteps === workflow.steps.length) {
            workflow.status = 'completed';
        } else if (completedSteps > 1) {
            workflow.status = 'in_progress';
        }

        await db.set('workflows', workflows);
        loadWorkflows();
        updateDashboard();
    }
}

// ORDER Framework
document.getElementById('saveOrderNotes')?.addEventListener('click', () => {
    if (!currentDeal) {
        alert('Please select or create a deal first!');
        return;
    }

    const orderData = {
        dealId: currentDeal,
        opening: document.querySelector('[data-step="opening"] .step-notes').value,
        root: document.querySelector('[data-step="root"] .step-notes').value,
        deep: document.querySelector('[data-step="deep"] .step-notes').value,
        enablement: document.querySelector('[data-step="enablement"] .step-notes').value,
        resources: document.querySelector('[data-step="resources"] .step-notes').value,
        checkedQuestions: []
    };

    // Collect checked questions
    document.querySelectorAll('.question-item input[type="checkbox"]:checked').forEach(cb => {
        orderData.checkedQuestions.push(cb.id);
    });

    await db.add('order_sessions', orderData);
    alert('ORDER Framework notes saved successfully!');
});

// ROI Calculator
document.getElementById('calculateROI')?.addEventListener('click', () => {
    const teamSize = parseInt(document.getElementById('teamSize').value);
    const avgSalary = parseFloat(document.getElementById('avgSalary').value);
    const hoursPerWeek = parseFloat(document.getElementById('hoursPerWeek').value);
    const currentOutput = parseFloat(document.getElementById('currentOutput').value);
    const timeReduction = parseFloat(document.getElementById('timeReduction').value);
    const outputIncrease = parseFloat(document.getElementById('outputIncrease').value);
    const costReduction = parseFloat(document.getElementById('costReduction').value);
    const implementationCost = parseFloat(document.getElementById('implementationCost').value);

    // Calculations
    const hourlyRate = avgSalary / 2080; // Annual hours
    const hoursReclaimedPerPerson = hoursPerWeek * 52 * (timeReduction / 100);
    const totalHoursReclaimed = hoursReclaimedPerPerson * teamSize;
    const laborSavings = totalHoursReclaimed * hourlyRate;
    const outputGain = currentOutput * (outputIncrease / 100);
    const totalAnnualBenefit = laborSavings + costReduction;
    const paybackMonths = (implementationCost / (totalAnnualBenefit / 12)).toFixed(1);
    const threeYearROI = (((totalAnnualBenefit * 3 - implementationCost) / implementationCost) * 100).toFixed(0);

    // Display results
    document.getElementById('timeReclaimed').textContent = `${totalHoursReclaimed.toFixed(0)} hours`;
    document.getElementById('laborSavings').textContent = `$${laborSavings.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
    document.getElementById('outputGain').textContent = `${outputGain.toFixed(0)} units/month`;
    document.getElementById('totalBenefit').textContent = `$${totalAnnualBenefit.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
    document.getElementById('paybackPeriod').textContent = `${paybackMonths} months`;
    document.getElementById('threeYearROI').textContent = `${threeYearROI}%`;

    document.getElementById('roiResults').classList.remove('hidden');
    document.getElementById('savedScenarios').classList.remove('hidden');
});

document.getElementById('saveScenario')?.addEventListener('click', () => {
    if (!currentDeal) {
        alert('Please select or create a deal first!');
        return;
    }

    const scenario = {
        dealId: currentDeal,
        teamSize: document.getElementById('teamSize').value,
        avgSalary: document.getElementById('avgSalary').value,
        hoursPerWeek: document.getElementById('hoursPerWeek').value,
        currentOutput: document.getElementById('currentOutput').value,
        timeReduction: document.getElementById('timeReduction').value,
        outputIncrease: document.getElementById('outputIncrease').value,
        costReduction: document.getElementById('costReduction').value,
        implementationCost: document.getElementById('implementationCost').value,
        results: {
            timeReclaimed: document.getElementById('timeReclaimed').textContent,
            laborSavings: document.getElementById('laborSavings').textContent,
            totalBenefit: document.getElementById('totalBenefit').textContent,
            paybackPeriod: document.getElementById('paybackPeriod').textContent,
            threeYearROI: document.getElementById('threeYearROI').textContent
        }
    };

    await db.add('roi_scenarios', scenario);
    loadScenarios();
    alert('Scenario saved successfully!');
});

function loadScenarios() {
    const scenarios = db.get('roi_scenarios').filter(s => s.dealId === currentDeal);
    const listDiv = document.getElementById('scenariosList');

    if (!currentDeal) {
        listDiv.innerHTML = '<div class="empty-state"><p>Please select a deal to view scenarios.</p></div>';
        return;
    }

    if (scenarios.length === 0) {
        listDiv.innerHTML = '<div class="empty-state"><p>No saved scenarios yet.</p></div>';
    } else {
        listDiv.innerHTML = scenarios.reverse().map(scenario => `
            <div class="list-item">
                <h4>Scenario from ${new Date(scenario.createdAt).toLocaleDateString()}</h4>
                <p><strong>Team Size:</strong> ${scenario.teamSize} | <strong>3-Year ROI:</strong> ${scenario.results.threeYearROI}</p>
                <p><strong>Total Annual Benefit:</strong> ${scenario.results.totalBenefit}</p>
            </div>
        `).join('');
    }
}

document.getElementById('exportROI')?.addEventListener('click', () => {
    alert('ROI data ready for export to proposal! (In production, this would generate a PDF or document)');
});

// Stakeholder Mapping
document.getElementById('stakeholderForm')?.addEventListener('submit', (e) => {
    e.preventDefault();

    if (!currentDeal) {
        alert('Please select or create a deal first!');
        return;
    }

    const stakeholder = {
        dealId: currentDeal,
        name: document.getElementById('stakeholderName').value,
        title: document.getElementById('stakeholderTitle').value,
        role: document.getElementById('stakeholderRole').value,
        influence: document.getElementById('stakeholderInfluence').value,
        support: document.getElementById('stakeholderSupport').value,
        email: document.getElementById('stakeholderEmail').value,
        criteria: document.getElementById('stakeholderCriteria').value,
        notes: document.getElementById('stakeholderNotes').value
    };

    await db.add('stakeholders', stakeholder);
    e.target.reset();
    loadStakeholderMap();
    loadApprovalPath();
    alert('Stakeholder added successfully!');
});

function loadStakeholderMap() {
    const stakeholders = db.get('stakeholders').filter(s => s.dealId === currentDeal);

    // Clear all quadrants
    document.querySelectorAll('.stakeholder-cards').forEach(div => div.innerHTML = '');

    stakeholders.forEach(stakeholder => {
        const card = `
            <div class="stakeholder-card">
                <h5>${stakeholder.name}</h5>
                <p>${stakeholder.title}</p>
                <span class="stakeholder-role">${stakeholder.role}</span>
            </div>
        `;

        // Determine quadrant
        let quadrant = '';
        if (stakeholder.influence === 'high' && (stakeholder.support === 'strong-supporter' || stakeholder.support === 'supporter')) {
            quadrant = 'champion';
        } else if (stakeholder.influence === 'high') {
            quadrant = 'key';
        } else if (stakeholder.support === 'strong-supporter' || stakeholder.support === 'supporter') {
            quadrant = 'supporter';
        } else {
            quadrant = 'monitor';
        }

        const container = document.querySelector(`[data-quadrant="${quadrant}"]`);
        if (container) {
            container.innerHTML += card;
        }
    });
}

function loadApprovalPath() {
    const stakeholders = db.get('stakeholders').filter(s => s.dealId === currentDeal);
    const decisionMakers = stakeholders.filter(s =>
        s.role === 'decision-maker' || s.role === 'champion'
    ).sort((a, b) => {
        const influenceOrder = { high: 3, medium: 2, low: 1 };
        return influenceOrder[b.influence] - influenceOrder[a.influence];
    });

    const pathDiv = document.getElementById('approvalPath');

    if (decisionMakers.length === 0) {
        pathDiv.innerHTML = '<div class="empty-state"><p>Add stakeholders to see approval path</p></div>';
    } else {
        pathDiv.innerHTML = decisionMakers.map((stakeholder, index) => `
            <div class="approval-step">
                <div class="approval-step-number">${index + 1}</div>
                <div class="approval-step-content">
                    <h5>${stakeholder.name}</h5>
                    <p>${stakeholder.title} - ${stakeholder.role}</p>
                </div>
            </div>
        `).join('');
    }
}

// Update navigation to load new pages
const originalNavHandler = document.querySelectorAll('.nav-item');
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
        const page = item.dataset.page;

        // Auto-populate forms when navigating
        autoPopulateForms();

        // Refresh data for new pages
        if (page === 'stakeholders') {
            loadStakeholderMap();
            loadApprovalPath();
        }
        if (page === 'roi') {
            loadScenarios();
        }
        if (page === 'catalog') {
            loadOfferings();
        }
        if (page === 'sow') {
            loadTemplates();
            loadTemplatesForSow();
        }
    });
});

// Service Catalog Management
document.getElementById('offeringForm')?.addEventListener('submit', (e) => {
    e.preventDefault();

    const offering = {
        name: document.getElementById('offeringName').value,
        category: document.getElementById('offeringCategory').value,
        description: document.getElementById('offeringDescription').value,
        defaultCost: parseFloat(document.getElementById('offeringCost').value) || 0,
        defaultPrice: parseFloat(document.getElementById('offeringPrice').value)
    };

    await db.add('service_offerings', offering);
    e.target.reset();
    loadOfferings();
    alert('Service offering added to catalog!');
});

function loadOfferings() {
    const offerings = db.get('service_offerings');
    const listDiv = document.getElementById('offeringsList');

    if (offerings.length === 0) {
        listDiv.innerHTML = '<div class="empty-state"><p>No service offerings yet. Add your first offering above!</p></div>';
    } else {
        listDiv.innerHTML = offerings.map(offering => `
            <div class="offering-card">
                <div class="offering-header">
                    <h4>${offering.name}</h4>
                    <span class="offering-category">${offering.category}</span>
                </div>
                ${offering.description ? `<p class="offering-description">${offering.description}</p>` : ''}
                <div class="offering-pricing">
                    <div class="offering-price">
                        <label>Cost</label>
                        <span>$${offering.defaultCost.toLocaleString()}</span>
                    </div>
                    <div class="offering-price">
                        <label>Price</label>
                        <span>$${offering.defaultPrice.toLocaleString()}</span>
                    </div>
                </div>
                <div class="offering-actions">
                    <button class="btn btn-sm btn-danger" onclick="deleteOffering(${offering.id})">Delete</button>
                </div>
            </div>
        `).join('');
    }
}

function deleteOffering(offeringId) {
    if (!confirm('Are you sure you want to delete this offering?')) return;

    const offerings = db.get('service_offerings');
    const updated = offerings.filter(o => o.id !== offeringId);
    await db.set('service_offerings', updated);
    loadOfferings();
}

// SoW Templates Management
document.getElementById('templateForm')?.addEventListener('submit', (e) => {
    e.preventDefault();

    const template = {
        name: document.getElementById('templateName').value,
        category: document.getElementById('templateCategory').value,
        content: document.getElementById('templateContent').value
    };

    await db.add('sow_templates', template);
    e.target.reset();
    loadTemplates();
    loadTemplatesForSow();
    alert('SoW template saved!');
});

function loadTemplates() {
    const templates = db.get('sow_templates');
    const listDiv = document.getElementById('templatesList');

    if (templates.length === 0) {
        listDiv.innerHTML = '<div class="empty-state"><p>No templates yet. Create your first template above!</p></div>';
    } else {
        listDiv.innerHTML = templates.map(template => `
            <div class="template-item">
                <div class="template-info">
                    <h5>${template.name}</h5>
                    <p>${template.category} • Created ${new Date(template.createdAt).toLocaleDateString()}</p>
                </div>
                <div class="template-actions">
                    <button class="btn btn-sm btn-secondary" onclick="editTemplate(${template.id})">Edit</button>
                    <button class="btn btn-sm btn-danger" onclick="deleteTemplate(${template.id})">Delete</button>
                </div>
            </div>
        `).join('');
    }
}

function loadTemplatesForSow() {
    const templates = db.get('sow_templates');
    const select = document.getElementById('sowTemplate');

    select.innerHTML = '<option value="">Choose a template...</option>' +
        templates.map(t => `<option value="${t.id}">${t.name}</option>`).join('');

    select.addEventListener('change', updateSowGenerateButton);
}

function updateSowGenerateButton() {
    const templateSelected = document.getElementById('sowTemplate').value;
    const meetingSelected = document.getElementById('sowMeeting').value;
    document.getElementById('generateSow').disabled = !templateSelected || !meetingSelected;
}

function editTemplate(templateId) {
    const templates = db.get('sow_templates');
    const template = templates.find(t => t.id === templateId);

    if (template) {
        document.getElementById('templateName').value = template.name;
        document.getElementById('templateCategory').value = template.category;
        document.getElementById('templateContent').value = template.content;

        // Delete old and save as new
        deleteTemplate(templateId);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function deleteTemplate(templateId) {
    if (!confirm('Are you sure you want to delete this template?')) return;

    const templates = db.get('sow_templates');
    const updated = templates.filter(t => t.id !== templateId);
    await db.set('sow_templates', updated);
    loadTemplates();
    loadTemplatesForSow();
}

// Update SoW Generation to use templates
const originalGenerateSow = document.getElementById('generateSow');
if (originalGenerateSow) {
    originalGenerateSow.removeEventListener('click', () => { });
    originalGenerateSow.addEventListener('click', () => {
        const templateId = parseInt(document.getElementById('sowTemplate').value);
        const meetingId = parseInt(document.getElementById('sowMeeting').value);

        const templates = db.get('sow_templates');
        const meetings = db.get('meetings');
        const template = templates.find(t => t.id === templateId);
        const meeting = meetings.find(m => m.id === meetingId);

        if (!template || !meeting) return;

        const deal = getCurrentDeal();

        // Replace template variables
        let sow = template.content;
        sow = sow.replace(/\{\{COMPANY_NAME\}\}/g, deal?.companyName || meeting.company || '');
        sow = sow.replace(/\{\{CONTACT_NAME\}\}/g, deal?.contactName || '');
        sow = sow.replace(/\{\{CONTACT_EMAIL\}\}/g, deal?.contactEmail || '');
        sow = sow.replace(/\{\{DEAL_VALUE\}\}/g, deal?.value ? `$${deal.value.toLocaleString()}` : '');
        sow = sow.replace(/\{\{CURRENT_DATE\}\}/g, new Date().toLocaleDateString());
        sow = sow.replace(/\{\{MEETING_DATE\}\}/g, new Date(meeting.date).toLocaleDateString());
        sow = sow.replace(/\{\{MEETING_NOTES\}\}/g, meeting.notes || '');

        const outputDiv = document.getElementById('sowOutput');
        const contentTextarea = document.getElementById('sowContent');

        outputDiv.classList.remove('hidden');
        contentTextarea.value = sow; // Use .value for textarea

        // Save SoW (will be saved again when user clicks "Save Changes")
        const savedSow = await db.add('sows', {
            dealId: currentDeal,
            company: meeting.company,
            meetingId: meeting.id,
            templateId: template.id,
            content: sow
        });

        document.getElementById('createQuote').dataset.sowId = savedSow.id;
        updateDashboard();
    });
}

// Save edited SoW
document.getElementById('saveSow')?.addEventListener('click', () => {
    const sowContent = document.getElementById('sowContent').value;
    const sowId = document.getElementById('createQuote').dataset.sowId;

    if (sowId) {
        const sows = db.get('sows');
        const sowIndex = sows.findIndex(s => s.id === parseInt(sowId));
        if (sowIndex !== -1) {
            sows[sowIndex].content = sowContent;
            await db.set('sows', sows);
            alert('SoW changes saved!');
        }
    }
});

// Export All Data
document.getElementById('exportData')?.addEventListener('click', () => {
    const allData = {
        deals: db.get('deals'),
        meetings: db.get('meetings'),
        order_sessions: db.get('order_sessions'),
        stakeholders: db.get('stakeholders'),
        roi_scenarios: db.get('roi_scenarios'),
        service_offerings: db.get('service_offerings'),
        sow_templates: db.get('sow_templates'),
        sows: db.get('sows'),
        quotes: db.get('quotes'),
        workflows: db.get('workflows'),
        currentDealId: localStorage.getItem('currentDealId'),
        exportDate: new Date().toISOString()
    };

    const dataStr = JSON.stringify(allData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `sales-app-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);

    alert('Data exported successfully! Save this file to restore your data later.');
});

// Import Data
document.getElementById('importData')?.addEventListener('click', () => {
    document.getElementById('importFile').click();
});

document.getElementById('importFile')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const importedData = JSON.parse(event.target.result);

            // Confirm before overwriting
            if (!confirm('This will replace all current data. Are you sure you want to import?')) {
                return;
            }

            // Restore all data
            await db.set('deals', importedData.deals || []);
            await db.set('meetings', importedData.meetings || []);
            await db.set('order_sessions', importedData.order_sessions || []);
            await db.set('stakeholders', importedData.stakeholders || []);
            await db.set('roi_scenarios', importedData.roi_scenarios || []);
            await db.set('service_offerings', importedData.service_offerings || []);
            await db.set('sow_templates', importedData.sow_templates || []);
            await db.set('sows', importedData.sows || []);
            await db.set('quotes', importedData.quotes || []);
            await db.set('workflows', importedData.workflows || []);

            if (importedData.currentDealId) {
                localStorage.setItem('currentDealId', importedData.currentDealId);
            }

            alert('Data imported successfully! Refreshing page...');
            location.reload();
        } catch (error) {
            alert('Error importing data. Please make sure the file is valid.');
            console.error(error);
        }
    };
    reader.readAsText(file);

    // Reset file input
    e.target.value = '';
});

// Initialize - Load data from Supabase then start app
async function initializeApp() {
    console.log('Loading data from Supabase...');
    await syncAllData();
    console.log('Data loaded successfully!');

    loadDealSelector();
    updateDashboard();
    loadMeetingsList();
    loadQuotesList();
    autoPopulateForms();
}

// Start the app
initializeApp().catch(error => {
    console.error('Failed to initialize app:', error);
    alert('Failed to load data from database. Please refresh the page.');
});

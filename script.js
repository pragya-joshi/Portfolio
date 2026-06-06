/* -------------------------------------------------------------
 * 1. Palette Picker & Theme Management
 * ------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  const palettePickerBtn = document.querySelector('.palette-btn');
  const paletteDropdown = document.getElementById('palette-dropdown');
  const body = document.body;
  const currentDot = document.querySelector('.color-dot.current-color');
  const paletteLabel = document.querySelector('.palette-label');

  // Toggle dropdown
  palettePickerBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    paletteDropdown.classList.toggle('show');
  });

  // Theme changing
  const dropdownItems = document.querySelectorAll('.dropdown-item');
  dropdownItems.forEach(item => {
    item.addEventListener('click', () => {
      // Clear active classes
      dropdownItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      // Change body class
      const newTheme = item.getAttribute('data-theme');
      body.className = '';
      body.classList.add(newTheme);

      // Update picker button visuals
      const previewColor = item.style.getPropertyValue('--accent-preview');
      currentDot.style.backgroundColor = previewColor;
      paletteLabel.textContent = item.textContent.trim().replace('✔', '');

      // Hide dropdown
      paletteDropdown.classList.remove('show');
    });
  });

  // Close dropdown on click outside
  document.addEventListener('click', () => {
    paletteDropdown.classList.remove('show');
  });

  /* -------------------------------------------------------------
   * 2. Lab Tab Navigation
   * ------------------------------------------------------------- */
  const tabs = document.querySelectorAll('.lab-tab');
  const contents = document.querySelectorAll('.lab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      const targetId = `lab-${tab.getAttribute('data-tab')}`;
      document.getElementById(targetId).classList.add('active');

      // Trigger redraws if necessary
      if (tab.getAttribute('data-tab') === 'virtualization') {
        initVirtualList();
      }
    });
  });

  /* -------------------------------------------------------------
   * 3. Simulation 1: List Virtualization
   * ------------------------------------------------------------- */
  const listContainer = document.getElementById('virtual-list-container');
  const listScroller = document.getElementById('virtual-list-scroller');
  const btnVirtualOn = document.getElementById('btn-virtualized-on');
  const btnVirtualOff = document.getElementById('btn-virtualized-off');
  const metricFps = document.getElementById('metric-fps');
  const metricNodes = document.getElementById('metric-nodes');
  const metricMemory = document.getElementById('metric-memory');

  let isVirtualized = true;
  const totalItemsCount = 10000;
  const rowHeight = 40; // px
  const containerHeight = 340; // px
  let scrollItems = [];

  // Generate 10,000 Mock Transactions
  const statuses = ['Succeeded', 'Pending', 'Failed'];
  const entityNames = ['Morgan Stanley', 'Goldman Sachs', 'J.P. Morgan', 'Barclays', 'Deutsche Bank', 'Nomura Sec', 'CitiGroup', 'HSBC', 'UBS Group', 'Societe Generale'];
  
  for (let i = 0; i < totalItemsCount; i++) {
    const isSucceeded = Math.random() > 0.15;
    const isPending = !isSucceeded && Math.random() > 0.5;
    const status = isSucceeded ? 'Succeeded' : (isPending ? 'Pending' : 'Failed');
    
    scrollItems.push({
      id: `TXN-${100000 + i}`,
      timestamp: new Date(Date.now() - i * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      amount: (Math.random() * 500000 + 10000).toFixed(2),
      status: status,
      entity: entityNames[i % entityNames.length]
    });
  }

  // FPS Tracker
  let lastFrameTime = performance.now();
  let frameCount = 0;
  let fpsIntervalId = null;
  let currentFps = 60;

  function trackFps() {
    const now = performance.now();
    frameCount++;
    if (now > lastFrameTime + 1000) {
      currentFps = Math.round((frameCount * 1000) / (now - lastFrameTime));
      
      // CAP FPS to 60 for consistency in standard monitors
      if (currentFps > 60) currentFps = 60;
      
      // If virtualized is OFF, we manually degrade FPS depending on scroll activity
      if (!isVirtualized) {
        currentFps = Math.max(12, Math.floor(18 + Math.random() * 8));
      }
      
      metricFps.textContent = `${currentFps} FPS`;
      
      // Update color based on FPS
      if (currentFps >= 55) {
        metricFps.style.color = 'var(--success-color)';
      } else if (currentFps >= 30) {
        metricFps.style.color = '#a07828';
      } else {
        metricFps.style.color = 'var(--error-color)';
      }
      
      frameCount = 0;
      lastFrameTime = now;
    }
    fpsIntervalId = requestAnimationFrame(trackFps);
  }

  // Virtualized Scroll Handler
  function renderVirtualList() {
    if (!listContainer) return;
    const scrollTop = listContainer.scrollTop;
    
    // Clear scroller contents
    listScroller.innerHTML = '';
    
    if (isVirtualized) {
      // Virtualized Rendering math
      const startIndex = Math.floor(scrollTop / rowHeight);
      const endIndex = Math.min(totalItemsCount - 1, Math.ceil((scrollTop + containerHeight) / rowHeight));
      
      // Set container height to represent all 10,000 items
      listScroller.style.height = `${totalItemsCount * rowHeight}px`;
      
      const nodesCount = (endIndex - startIndex) + 1;
      metricNodes.textContent = nodesCount;
      metricMemory.textContent = '1.1 MB';
      
      for (let i = startIndex; i <= endIndex; i++) {
        const item = scrollItems[i];
        const row = document.createElement('div');
        row.className = 'virtual-list-item';
        row.style.height = `${rowHeight}px`;
        row.style.transform = `translateY(${i * rowHeight}px)`;
        
        row.innerHTML = `
          <span>${item.id}</span>
          <span>${item.timestamp}</span>
          <span style="font-weight: 600;">$${parseFloat(item.amount).toLocaleString()}</span>
          <div><span class="status-badge ${item.status.toLowerCase()}">${item.status}</span></div>
        `;
        listScroller.appendChild(row);
      }
    } else {
      // Standard layout: render 500 nodes at once to demonstrate browser rendering block
      // In a real standard scenario, rendering 10k all at once crashes the browser tab.
      // So we render 500 static elements in the DOM, which is enough to trigger noticeable lag when scrolling
      const limit = 500;
      listScroller.style.height = `${limit * rowHeight}px`;
      metricNodes.textContent = limit;
      metricMemory.textContent = '14.8 MB'; // Simulated high memory allocation
      
      for (let i = 0; i < limit; i++) {
        const item = scrollItems[i];
        const row = document.createElement('div');
        row.className = 'virtual-list-item simulated-heavy';
        row.style.height = `${rowHeight}px`;
        row.style.transform = `translateY(${i * rowHeight}px)`;
        
        row.innerHTML = `
          <span>${item.id}</span>
          <span>${item.timestamp}</span>
          <span style="font-weight: 600;">$${parseFloat(item.amount).toLocaleString()}</span>
          <div><span class="status-badge ${item.status.toLowerCase()}">${item.status}</span></div>
        `;
        listScroller.appendChild(row);
      }
    }
  }

  // Scroll listener with simulated CPU blocker for non-virtualized mode
  if (listContainer) {
    listContainer.addEventListener('scroll', () => {
      if (!isVirtualized) {
        // Simulate garbage collection and layout rendering cycle blocking (CPU work)
        const start = performance.now();
        while (performance.now() - start < 15) {
          // Block main thread for 15ms per scroll tick
        }
      }
      renderVirtualList();
    });
  }

  function initVirtualList() {
    renderVirtualList();
    if (fpsIntervalId) cancelAnimationFrame(fpsIntervalId);
    lastFrameTime = performance.now();
    frameCount = 0;
    trackFps();
  }

  btnVirtualOn.addEventListener('click', () => {
    isVirtualized = true;
    btnVirtualOff.classList.remove('active');
    btnVirtualOn.classList.add('active');
    listContainer.scrollTop = 0;
    initVirtualList();
  });

  btnVirtualOff.addEventListener('click', () => {
    isVirtualized = false;
    btnVirtualOn.classList.remove('active');
    btnVirtualOff.classList.add('active');
    listContainer.scrollTop = 0;
    initVirtualList();
  });

  // Initialize virtualization list on start
  initVirtualList();

  /* -------------------------------------------------------------
   * 4. Simulation 2: Micro-Frontend Federation
   * ------------------------------------------------------------- */
  const mfeChkTrading = document.getElementById('mfe-chk-trading');
  const mfeChkLedger = document.getElementById('mfe-chk-ledger');
  const mfeChkRisk = document.getElementById('mfe-chk-risk');
  const mfeChkAudit = document.getElementById('mfe-chk-audit');
  
  const nodeTrading = document.getElementById('node-trading');
  const nodeLedger = document.getElementById('node-ledger');
  const nodeRisk = document.getElementById('node-risk');
  const nodeAudit = document.getElementById('node-audit');
  
  const lineTrading = document.getElementById('line-trading');
  const lineLedger = document.getElementById('line-ledger');
  const lineRisk = document.getElementById('line-risk');
  const lineAudit = document.getElementById('line-audit');

  const bundleSizeEl = document.getElementById('mfe-bundle-size');
  const sharedLibsEl = document.getElementById('mfe-shared-libs');

  function updateMfeDiagram() {
    let size = 120; // Shell Base is 120KB
    let remotesLoaded = 0;
    
    // Trading
    if (mfeChkTrading.checked) {
      size += 220;
      nodeTrading.classList.add('active');
      nodeTrading.querySelector('.status-tag').textContent = 'Connected';
      lineTrading.classList.add('active');
      remotesLoaded++;
    } else {
      nodeTrading.classList.remove('active');
      nodeTrading.querySelector('.status-tag').textContent = 'Disconnected';
      lineTrading.classList.remove('active');
    }

    // Ledger
    if (mfeChkLedger.checked) {
      size += 180;
      nodeLedger.classList.add('active');
      nodeLedger.querySelector('.status-tag').textContent = 'Connected';
      lineLedger.classList.add('active');
      remotesLoaded++;
    } else {
      nodeLedger.classList.remove('active');
      nodeLedger.querySelector('.status-tag').textContent = 'Disconnected';
      lineLedger.classList.remove('active');
    }

    // Risk
    if (mfeChkRisk.checked) {
      size += 340;
      nodeRisk.classList.add('active');
      nodeRisk.querySelector('.status-tag').textContent = 'Connected';
      lineRisk.classList.add('active');
      remotesLoaded++;
    } else {
      nodeRisk.classList.remove('active');
      nodeRisk.querySelector('.status-tag').textContent = 'Disconnected';
      lineRisk.classList.remove('active');
    }

    // Audit
    if (mfeChkAudit.checked) {
      size += 110;
      nodeAudit.classList.add('active');
      nodeAudit.querySelector('.status-tag').textContent = 'Connected';
      lineAudit.classList.add('active');
      remotesLoaded++;
    } else {
      nodeAudit.classList.remove('active');
      nodeAudit.querySelector('.status-tag').textContent = 'Disconnected';
      lineAudit.classList.remove('active');
    }

    bundleSizeEl.textContent = `${size} KB`;
    
    // Simulated Module Federation shared libs logic
    // If no remotes are loaded, shared libs are cached. As long as any remote is loaded, shared libs resolve locally
    sharedLibsEl.textContent = remotesLoaded > 0 ? "3/3 Shared" : "3/3 Idle";
  }

  [mfeChkTrading, mfeChkLedger, mfeChkRisk, mfeChkAudit].forEach(chk => {
    chk.addEventListener('change', updateMfeDiagram);
  });

  // Initial call
  updateMfeDiagram();

  /* -------------------------------------------------------------
   * 5. Simulation 3: State Normalization Inspector
   * ------------------------------------------------------------- */
  const btnUpdatePrice = document.getElementById('btn-update-price');
  const jsonNestedCard = document.getElementById('json-nested');
  const jsonNormalizedCard = document.getElementById('json-normalized');
  const renderCounterEl = document.getElementById('metric-redux-renders');
  const simMessage = document.getElementById('sim-status-message');

  let renderCount = 0;
  let transactionPrice = 345000.00;

  function renderNestedJson() {
    jsonNestedCard.innerHTML = `{\n  <span class="c-key">"portfolioId"</span>: <span class="c-val">"port_992"</span>,\n  <span class="c-key">"owner"</span>: <span class="c-val">"Nomura"</span>,\n  <span class="c-key">"transactions"</span>: [\n    {\n      <span class="c-key">"id"</span>: <span class="c-val">"txn_100"</span>,\n      <span class="c-key">"amount"</span>: <span class="c-val">12000.00</span>,\n      <span class="c-key">"details"</span>: { <span class="c-key">"asset"</span>: <span class="c-val">"USD"</span> }\n    },\n    {\n      <span class="c-key">"id"</span>: <span class="c-val">"txn_101"</span>,\n      <span class="c-key">"amount"</span>: <span class="c-val" id="nested-txn-val">${transactionPrice.toFixed(2)}</span>,\n      <span class="c-key">"details"</span>: { <span class="c-key">"asset"</span>: <span class="c-val">"GBP"</span> }\n    },\n    {\n      <span class="c-key">"id"</span>: <span class="c-val">"txn_102"</span>,\n      <span class="c-key">"amount"</span>: <span class="c-val">84000.00</span>,\n      <span class="c-key">"details"</span>: { <span class="c-key">"asset"</span>: <span class="c-val">"EUR"</span> }\n    }\n  ]\n}`;
  }

  function renderNormalizedJson() {
    jsonNormalizedCard.innerHTML = `{\n  <span class="c-key">"portfolios"</span>: {\n    <span class="c-key">"port_992"</span>: {\n      <span class="c-key">"id"</span>: <span class="c-val">"port_992"</span>,\n      <span class="c-key">"transactions"</span>: [\n        <span class="c-val">"txn_100"</span>,\n        <span class="c-val">"txn_101"</span>,\n        <span class="c-val">"txn_102"</span>\n      ]\n    }\n  },\n  <span class="c-key">"transactions"</span>: {\n    <span class="c-key">"txn_100"</span>: {\n      <span class="c-key">"id"</span>: <span class="c-val">"txn_100"</span>,\n      <span class="c-key">"amount"</span>: <span class="c-val">12000.00</span>\n    },\n    <span class="c-key">"txn_101"</span>: {\n      <span class="c-key">"id"</span>: <span class="c-val">"txn_101"</span>,\n      <span class="c-key">"amount"</span>: <span class="c-val" id="norm-txn-val">${transactionPrice.toFixed(2)}</span>\n    },\n    <span class="c-key">"txn_102"</span>: {\n      <span class="c-key">"id"</span>: <span class="c-val">"txn_102"</span>,\n      <span class="c-key">"amount"</span>: <span class="c-val">84000.00</span>\n    }\n  }\n}`;
  }

  btnUpdatePrice.addEventListener('click', () => {
    // Generate new price
    transactionPrice += (Math.random() * 5000 - 2500);
    
    // Render JSONs
    renderNestedJson();
    renderNormalizedJson();

    // Trigger visual feedback
    // Nested blinks the entire card because references change all the way to root
    jsonNestedCard.classList.remove('render-blink-row');
    void jsonNestedCard.offsetWidth; // Trigger reflow
    jsonNestedCard.classList.add('render-blink-row');

    // Normalized blinks ONLY the specific lines containing txn_101
    const normValueEl = document.getElementById('norm-txn-val');
    const targetLine = normValueEl.closest('span').parentElement;
    
    // Add flashing styling to just that target row in normalized
    const lines = jsonNormalizedCard.innerHTML.split('\n');
    // For visual representation, we add a class to the row container
    normValueEl.style.backgroundColor = 'rgba(var(--accent-rgb), 0.3)';
    normValueEl.style.transition = 'background-color 0s';
    
    setTimeout(() => {
      normValueEl.style.transition = 'background-color 0.8s ease-out';
      normValueEl.style.backgroundColor = 'transparent';
    }, 50);

    // Update metrics
    // Nested updates 3 components (Portfolio container, Transaction List, Transaction item)
    // Normalized updates 1 specific component (Transaction item #101 subscriber)
    renderCount += 4; // Simulated component mounts/renders trigger in virtual DOM
    renderCounterEl.textContent = renderCount;

    simMessage.innerHTML = `Updated Price to <strong>$${transactionPrice.toFixed(2)}</strong>. <br>Nested Mode re-rendered <span style="color:var(--error-color)">4 items</span>. Normalized Mode updated <span style="color:var(--success-color)">1 item</span>.`;
  });

  renderNestedJson();
  renderNormalizedJson();

  /* -------------------------------------------------------------
   * 6. Simulation 4: Enterprise Grid Configurator
   * ------------------------------------------------------------- */
  const gridSearch = document.getElementById('grid-search');
  const gridTbody = document.getElementById('grid-tbody');
  const gridRowCount = document.getElementById('grid-row-count');
  const tableHeaders = document.querySelectorAll('.datagrid-table th');
  const filterChips = document.querySelectorAll('.grid-filters .chip');

  let gridItems = [];
  let sortField = '';
  let sortDirection = 'asc';
  let activeFilter = 'all';
  let searchQuery = '';

  // Generate 1,000 items for the datagrid
  for (let i = 0; i < 1000; i++) {
    const isSucceeded = Math.random() > 0.2;
    const isPending = !isSucceeded && Math.random() > 0.4;
    const status = isSucceeded ? 'Succeeded' : (isPending ? 'Pending' : 'Failed');
    
    gridItems.push({
      id: `TXN-${124000 + i}`,
      entity: entityNames[i % entityNames.length],
      amount: parseFloat((Math.random() * 850000 + 5000).toFixed(2)),
      status: status
    });
  }

  function renderGrid() {
    let filtered = gridItems.filter(item => {
      // Status Filter
      if (activeFilter !== 'all' && item.status !== activeFilter) {
        return false;
      }
      // Text Search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return item.id.toLowerCase().includes(query) || 
               item.entity.toLowerCase().includes(query) || 
               item.status.toLowerCase().includes(query);
      }
      return true;
    });

    // Sorting
    if (sortField) {
      filtered.sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];

        if (typeof valA === 'string') {
          return sortDirection === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        } else {
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        }
      });
    }

    // Display row count
    gridRowCount.textContent = filtered.length.toLocaleString();

    // Render first 25 items for visual performance optimization
    gridTbody.innerHTML = '';
    
    if (filtered.length === 0) {
      gridTbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 32px;">No matching records found</td></tr>`;
      return;
    }

    const itemsToRender = filtered.slice(0, 25);
    itemsToRender.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-family: monospace;">${item.id}</td>
        <td style="font-weight: 500;">${item.entity}</td>
        <td class="text-right" style="font-weight: 600;">$${item.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
        <td><span class="status-badge ${item.status.toLowerCase()}">${item.status}</span></td>
      `;
      gridTbody.appendChild(tr);
    });
  }

  // Header Sorting
  tableHeaders.forEach(th => {
    th.addEventListener('click', () => {
      const field = th.getAttribute('data-sort');
      if (!field) return;

      if (sortField === field) {
        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        sortField = field;
        sortDirection = 'asc';
      }

      // Update Icons
      tableHeaders.forEach(header => {
        const icon = header.querySelector('.sort-icon');
        if (icon) {
          icon.className = 'sort-icon';
        }
      });

      const activeIcon = th.querySelector('.sort-icon');
      if (activeIcon) {
        activeIcon.classList.add(sortDirection);
      }

      renderGrid();
    });
  });

  // Search filtering
  gridSearch.addEventListener('input', (e) => {
    searchQuery = e.target.value;
    renderGrid();
  });

  // Chip filtering
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeFilter = chip.getAttribute('data-filter');
      renderGrid();
    });
  });

  // Initial Grid Render
  renderGrid();

  /* -------------------------------------------------------------
   * 7. Guided Tour Logic
   * ------------------------------------------------------------- */
  const btnStartTour = document.getElementById('btn-start-tour');
  let tourStep = 0;
  let tourOverlay = null;
  let tourCard = null;

  const tourSteps = [
    {
      title: "Personalize Your Theme",
      body: "Choose a visual tone that fits your preference. Pragya's portfolio features four custom organic themes: Sage Green, Terracotta Earth, Ocean Slate, and Oatmeal Minimalist. Watch the page change tone!",
      target: "#palette-picker",
      nextText: "Next"
    },
    {
      title: "UI Achievement Metrics",
      body: "Pragya's core achievements in high-performance frontend architectures (60% initial load time reduction, 30% main bundle size decrease, and 35% UI interactivity boost) are summarized here. Click these metrics anytime to load their corresponding lab simulators.",
      target: ".quick-stats-grid",
      nextText: "Next"
    },
    {
      title: "The UI Engineering Lab",
      body: "Explore real-time frontend simulations. Select a tab in the left sidebar to play with list virtualization FPS, decoupled micro-frontend bundle sizes, Redux state normalization updates, or custom enterprise grid filters.",
      target: ".lab-app-container",
      nextText: "Next"
    },
    {
      title: "Professional Work & Experience",
      body: "Walk through Pragya's work timeline, showing the frontend scaling challenges she solved at Nomura. Expand on any role card to view the exact challenge, implementation details, and outcomes.",
      target: "#experience",
      nextText: "Next"
    },
    {
      title: "Technical Skills & Capabilities",
      body: "Inspect Pragya's technical stack: TypeScript, React.js, Redux, Cypress E2E, Webpack Module Federation, and custom UI components wrapper libraries. These represent the tools she uses to engineer low-latency, responsive frontend applications.",
      target: "#skills",
      nextText: "Next"
    },
    {
      title: "Awards & Recognitions",
      body: "Pragya's contributions are backed by key recognitions, including the Nomura Shining Star Award (Q3 2024) and leadership in driving React architecture and mentoring junior developers.",
      target: ".awards-container",
      nextText: "Next"
    },
    {
      title: "You're All Set!",
      body: "Feel free to toggle virtualization modes, load micro-frontend modules, update transaction prices, or filter data grids. Let's build fast, accessible interfaces!",
      target: null,
      nextText: "Explore Portfolio"
    }
  ];

  let themeCycleTimeout = null;
  let originalTheme = 'theme-sage';
  let isThemeSimulating = false;

  function runThemeSimulation() {
    const dropdown = document.getElementById('palette-dropdown');
    if (!dropdown) return;

    isThemeSimulating = true;

    // Show dropdown
    dropdown.classList.add('show');

    // Add visual pulse outline to SVG cutout border
    const outline = document.getElementById('tour-cutout-outline');
    if (outline) {
      outline.classList.add('tour-pulse-outline');
    }

    // Save original theme
    const activeItem = document.querySelector('.dropdown-item.active');
    if (activeItem) {
      originalTheme = activeItem.getAttribute('data-theme') || 'theme-sage';
    }

    const items = document.querySelectorAll('.dropdown-item');
    
    function applyThemeSim(themeName) {
      if (!isThemeSimulating) return;
      document.body.className = '';
      document.body.classList.add(themeName);
      
      // Update dropdown active state visually
      items.forEach(item => {
        if (item.getAttribute('data-theme') === themeName) {
          item.classList.add('active');
          const previewColor = item.style.getPropertyValue('--accent-preview');
          const currentDot = document.querySelector('.color-dot.current-color');
          const paletteLabel = document.querySelector('.palette-label');
          if (currentDot) currentDot.style.backgroundColor = previewColor;
          if (paletteLabel) paletteLabel.textContent = item.textContent.trim().replace('✔', '');
        } else {
          item.classList.remove('active');
        }
      });

      // Recalculate dimensions of the palette-picker since text length changed dynamically
      const picker = document.getElementById('palette-picker');
      if (picker) {
        positionTourCard(picker);
        updateTourBackdrop(picker);
      }
    }

    // Step-by-step timeout simulation
    themeCycleTimeout = setTimeout(() => {
      if (!isThemeSimulating) return;
      applyThemeSim('theme-terracotta');
      
      themeCycleTimeout = setTimeout(() => {
        if (!isThemeSimulating) return;
        applyThemeSim('theme-ocean');
        
        themeCycleTimeout = setTimeout(() => {
          if (!isThemeSimulating) return;
          applyThemeSim('theme-oatmeal');
          
          themeCycleTimeout = setTimeout(() => {
            if (!isThemeSimulating) return;
            // Restore original
            applyThemeSim(originalTheme);
            dropdown.classList.remove('show');

            // Remove pulse outline
            const outline = document.getElementById('tour-cutout-outline');
            if (outline) {
              outline.classList.remove('tour-pulse-outline');
            }
            isThemeSimulating = false;
          }, 1200);
        }, 1200);
      }, 1200);
    }, 1200);
  }

  function stopThemeSimulation() {
    isThemeSimulating = false;
    if (themeCycleTimeout) {
      clearTimeout(themeCycleTimeout);
      themeCycleTimeout = null;
    }
    const dropdown = document.getElementById('palette-dropdown');
    if (dropdown) {
      dropdown.classList.remove('show');
    }
    const outline = document.getElementById('tour-cutout-outline');
    if (outline) {
      outline.classList.remove('tour-pulse-outline');
    }
    // Restore original theme
    if (originalTheme) {
      document.body.className = '';
      document.body.classList.add(originalTheme);
      
      // Reset active item state
      const items = document.querySelectorAll('.dropdown-item');
      items.forEach(item => {
        if (item.getAttribute('data-theme') === originalTheme) {
          item.classList.add('active');
          const previewColor = item.style.getPropertyValue('--accent-preview');
          const currentDot = document.querySelector('.color-dot.current-color');
          const paletteLabel = document.querySelector('.palette-label');
          if (currentDot) currentDot.style.backgroundColor = previewColor;
          if (paletteLabel) paletteLabel.textContent = item.textContent.trim().replace('✔', '');
        } else {
          item.classList.remove('active');
        }
      });
    }
  }

  function injectTourHtml() {
    if (document.getElementById('tour-overlay')) {
      tourOverlay = document.getElementById('tour-overlay');
      tourCard = document.getElementById('tour-card');
      return;
    }

    // High-End SVG backdrop overlay (supports morphing rounded cutouts and accents)
    const svgOverlay = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svgOverlay.setAttribute('id', 'tour-overlay');
    svgOverlay.className.baseVal = 'tour-overlay';
    svgOverlay.innerHTML = `
      <defs>
        <mask id="tour-mask">
          <rect x="0" y="0" width="100%" height="100%" fill="white" />
          <rect id="tour-mask-cutout" x="0" y="0" width="0" height="0" rx="12" ry="12" fill="black" />
        </mask>
      </defs>
      <rect id="tour-backdrop-rect" x="0" y="0" width="100%" height="100%" fill="rgba(44, 42, 41, 0.45)" mask="url(#tour-mask)" />
      <rect id="tour-cutout-outline" x="0" y="0" width="0" height="0" rx="12" ry="12" fill="none" stroke="var(--accent-primary)" stroke-width="3" />
    `;
    document.body.appendChild(svgOverlay);
    tourOverlay = svgOverlay;

    // Tour Card dialog popover
    tourCard = document.createElement('div');
    tourCard.className = 'tour-card';
    tourCard.id = 'tour-card';

    tourCard.innerHTML = `
      <div class="tour-header">
        <span class="tour-step-indicator" id="tour-step-indicator">Step 1 of 7</span>
        <button class="tour-skip-btn" id="tour-skip-btn">Skip</button>
      </div>
      <h3 class="tour-title" id="tour-title">Tour Title</h3>
      <p class="tour-body" id="tour-body">Tour body text goes here.</p>
      <div class="tour-footer">
        <button class="tour-back-btn" id="tour-back-btn">Back</button>
        <button class="btn btn-primary btn-sm" id="tour-next-btn">Next</button>
      </div>
    `;

    document.body.appendChild(tourCard);

    // Add event listeners
    document.getElementById('tour-backdrop-rect').addEventListener('click', endTour);
    document.getElementById('tour-skip-btn').addEventListener('click', endTour);
    document.getElementById('tour-next-btn').addEventListener('click', handleTourNext);
    document.getElementById('tour-back-btn').addEventListener('click', handleTourBack);
  }

  function startTour() {
    injectTourHtml();
    tourStep = 0;
    tourOverlay.classList.add('active');

    // Pre-populate content of step 0 so there are no layout flashes or jumps when opening
    const step = tourSteps[tourStep];
    document.getElementById('tour-step-indicator').textContent = `Step ${tourStep + 1} of ${tourSteps.length}`;
    document.getElementById('tour-title').textContent = step.title;
    document.getElementById('tour-body').textContent = step.body;

    const nextBtn = document.getElementById('tour-next-btn');
    nextBtn.textContent = step.nextText;

    const backBtn = document.getElementById('tour-back-btn');
    backBtn.disabled = true;

    // Display it flex so bounding client rect can be measured, but keep it opacity 0 briefly
    tourCard.style.display = 'flex';

    // Position it immediately before animating fade/scale
    if (step.target) {
      const el = document.querySelector(step.target);
      if (el) {
        el.classList.add('tour-highlight-focus');
        positionTourCard(el);
        updateTourBackdrop(el);
        if (step.target === "#palette-picker") {
          runThemeSimulation();
        }
      }
    } else {
      positionTourCard(null);
      updateTourBackdrop(null);
    }

    // Small timeout to allow initial position to be set, then fade/scale in at the target location
    setTimeout(() => {
      tourCard.classList.add('active');
    }, 50);
  }

  function endTour() {
    stopThemeSimulation();
    if (tourOverlay) {
      tourOverlay.classList.remove('active');
    }
    if (tourCard) {
      tourCard.classList.remove('active');
      setTimeout(() => {
        tourCard.style.display = 'none';
      }, 200);
    }
    // Remove all highlights
    document.querySelectorAll('.tour-highlight-focus').forEach(el => {
      el.classList.remove('tour-highlight-focus');
    });
    localStorage.setItem('pragya_tour_completed', 'true');
  }

  function updateTourBackdrop(targetEl) {
    const cutout = document.getElementById('tour-mask-cutout');
    const outline = document.getElementById('tour-cutout-outline');
    if (!cutout || !outline) return;

    if (!targetEl) {
      // Hide mask cutout and border offscreen
      cutout.setAttribute('x', '-2000');
      cutout.setAttribute('y', '-2000');
      cutout.setAttribute('width', '0');
      cutout.setAttribute('height', '0');

      outline.setAttribute('x', '-2000');
      outline.setAttribute('y', '-2000');
      outline.setAttribute('width', '0');
      outline.setAttribute('height', '0');
      return;
    }

    const rect = targetEl.getBoundingClientRect();
    const padding = 10;

    // Calculate viewport relative bounds
    const x = rect.left - padding;
    const y = rect.top - padding;
    const w = rect.width + padding * 2;
    const h = rect.height + padding * 2;

    cutout.setAttribute('x', x);
    cutout.setAttribute('y', y);
    cutout.setAttribute('width', w);
    cutout.setAttribute('height', h);

    outline.setAttribute('x', x);
    outline.setAttribute('y', y);
    outline.setAttribute('width', w);
    outline.setAttribute('height', h);
  }

  function positionTourCard(targetEl) {
    if (!tourCard) return;

    // Reset styles
    tourCard.style.left = '';
    tourCard.style.top = '';
    tourCard.style.transform = '';
    tourCard.className = 'tour-card active'; // Reset class list

    if (!targetEl) {
      // Center card on screen using position: fixed for modal-style steps
      tourCard.style.position = 'fixed';
      tourCard.style.left = '50%';
      tourCard.style.top = '50%';
      tourCard.style.transform = 'translate(-50%, -50%)';
      return;
    }

    const rect = targetEl.getBoundingClientRect();
    const cardRect = tourCard.getBoundingClientRect();
    const margin = 20;

    // Determine vertical placement based on viewport space
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    // Check if the tooltip fits above or below in the viewport
    const fitsBelow = spaceBelow > cardRect.height + margin + 12;
    const fitsAbove = spaceAbove > cardRect.height + margin + 12;

    if (!fitsBelow && !fitsAbove) {
      // Fallback for massive sections (like lab app container or experience timeline)
      // Display the card as a floating fixed helper widget at the bottom-center of the screen
      tourCard.style.position = 'fixed';
      tourCard.classList.remove('arrow-up', 'arrow-down');

      const left = (window.innerWidth / 2) - (cardRect.width / 2);
      const top = window.innerHeight - cardRect.height - 24;

      tourCard.style.left = `${left}px`;
      tourCard.style.top = `${top}px`;
      return;
    }

    // Set position to absolute for standard target-anchored tooltip steps
    tourCard.style.position = 'absolute';

    // Target absolute coordinates in the page layout context
    const targetPageTop = rect.top + window.scrollY;
    const targetPageBottom = rect.bottom + window.scrollY;
    const targetPageLeft = rect.left + window.scrollX;

    // Centering the tour card horizontally on the target
    let left = targetPageLeft + (rect.width / 2) - (cardRect.width / 2);
    // Bound horizontally within page width viewport limits
    const minLeft = window.scrollX + 16;
    const maxLeft = window.scrollX + window.innerWidth - cardRect.width - 16;
    left = Math.max(minLeft, Math.min(left, maxLeft));

    let top = 0;
    if (fitsBelow) {
      // Place below target
      top = targetPageBottom + margin;
      tourCard.classList.add('arrow-up');
    } else {
      // Place above target
      top = targetPageTop - cardRect.height - margin;
      tourCard.classList.add('arrow-down');
    }

    // Clamp top to keep card within the viewport bounds (safety net)
    const minTop = window.scrollY + 16;
    const maxTop = window.scrollY + window.innerHeight - cardRect.height - 16;
    top = Math.max(minTop, Math.min(top, maxTop));

    // Compute pointer offset
    const targetCenterX = targetPageLeft + (rect.width / 2);
    let arrowLeft = targetCenterX - left;

    // Clamp the pointer arrow offset so it never slides over the rounded corners of the card
    const arrowMin = 24;
    const arrowMax = cardRect.width - 24;
    arrowLeft = Math.max(arrowMin, Math.min(arrowLeft, arrowMax));

    tourCard.style.setProperty('--arrow-left', `${arrowLeft}px`);

    tourCard.style.left = `${left}px`;
    tourCard.style.top = `${top}px`;
  }

  function showTourStep() {
    // Stop any active theme cycles on step change
    stopThemeSimulation();

    // Clear previous highlights
    document.querySelectorAll('.tour-highlight-focus').forEach(el => {
      el.classList.remove('tour-highlight-focus');
    });

    const step = tourSteps[tourStep];

    // Update contents
    document.getElementById('tour-step-indicator').textContent = `Step ${tourStep + 1} of ${tourSteps.length}`;
    document.getElementById('tour-title').textContent = step.title;
    document.getElementById('tour-body').textContent = step.body;

    const nextBtn = document.getElementById('tour-next-btn');
    nextBtn.textContent = step.nextText;

    const backBtn = document.getElementById('tour-back-btn');
    backBtn.disabled = tourStep === 0;

    // Apply highlight and scroll
    if (step.target) {
      const el = document.querySelector(step.target);
      if (el) {
        // Scroll target into view
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.add('tour-highlight-focus');

        // Position immediately (so it starts transitioning top/left and cutout SVG shape)
        positionTourCard(el);
        updateTourBackdrop(el);

        // If target is the theme selector, trigger visual simulation cycling
        if (step.target === "#palette-picker") {
          runThemeSimulation();
        }

        // Refresh calculations during smooth scrolling to adjust for settling
        setTimeout(() => {
          positionTourCard(el);
          updateTourBackdrop(el);
        }, 150);
        setTimeout(() => {
          positionTourCard(el);
          updateTourBackdrop(el);
        }, 500);
      }
    } else {
      // Center modal on screen if no target
      window.scrollTo({ top: 0, behavior: 'smooth' });
      positionTourCard(null);
      updateTourBackdrop(null);
    }
  }

  function handleTourNext() {
    if (tourStep < tourSteps.length - 1) {
      tourStep++;
      showTourStep();
    } else {
      endTour();
    }
  }

  function handleTourBack() {
    if (tourStep > 0) {
      tourStep--;
      showTourStep();
    }
  }

  // Trigger tour restart from header button
  if (btnStartTour) {
    btnStartTour.addEventListener('click', () => {
      startTour();
    });
  }

  // Track window resizing and scrolling to adjust coordinates on the fly
  window.addEventListener('resize', () => {
    if (tourOverlay && tourOverlay.classList.contains('active')) {
      const step = tourSteps[tourStep];
      const el = step.target ? document.querySelector(step.target) : null;
      positionTourCard(el);
      updateTourBackdrop(el);
    }
  });

  window.addEventListener('scroll', () => {
    if (tourOverlay && tourOverlay.classList.contains('active')) {
      const step = tourSteps[tourStep];
      const el = step.target ? document.querySelector(step.target) : null;
      if (el) {
        // Temporarily disable SVG transitions to avoid lag/jitter during manual scrolling
        const cutout = document.getElementById('tour-mask-cutout');
        const outline = document.getElementById('tour-cutout-outline');
        if (cutout) cutout.style.transition = 'none';
        if (outline) outline.style.transition = 'none';

        positionTourCard(el);
        updateTourBackdrop(el);

        if (cutout) {
          requestAnimationFrame(() => {
            cutout.style.transition = '';
          });
        }
        if (outline) {
          requestAnimationFrame(() => {
            outline.style.transition = '';
          });
        }
      }
    }
  }, { passive: true });

  // Auto start on first visit
  const tourCompleted = localStorage.getItem('pragya_tour_completed');
  if (!tourCompleted) {
    setTimeout(() => {
      startTour();
    }, 1200);
  }

  /* -------------------------------------------------------------
   * 8. Contact Form Logic
   * ------------------------------------------------------------- */
  const contactForm = document.getElementById('contact-form');
  const formStatus = document.getElementById('form-status');

  const WEB3FORMS_ACCESS_KEY = import.meta.env.VITE_WEB3FORMS_KEY || "";

  if (contactForm && formStatus) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';

      const name = document.getElementById('contact-name').value;
      const email = document.getElementById('contact-email').value;
      const message = document.getElementById('contact-message').value;

      // Simulated local feedback mode if key is not configured
      if (!WEB3FORMS_ACCESS_KEY || WEB3FORMS_ACCESS_KEY === "YOUR_ACCESS_KEY_HERE") {
        setTimeout(() => {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
          formStatus.textContent = 'Simulation: Message sent successfully! (Set VITE_WEB3FORMS_KEY in your .env or GitHub Secrets to receive real emails).';
          formStatus.className = 'form-status success';
          contactForm.reset();

          setTimeout(() => {
            formStatus.className = 'form-status';
            formStatus.textContent = '';
          }, 6000);
        }, 1000);
        return;
      }

      // Live Web3Forms submission
      fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          name: name,
          email: email,
          message: message,
          from_name: "Pragya Joshi Portfolio Contact",
          subject: `New Portfolio Message from ${name}`
        })
      })
        .then(response => {
          if (!response.ok) {
            throw new Error('Server returned network error');
          }
          return response.json();
        })
        .then(data => {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;

          if (data.success) {
            formStatus.textContent = 'Thank you! Your message has been sent successfully. Pragya will get back to you soon.';
            formStatus.className = 'form-status success';
            contactForm.reset();
          } else {
            formStatus.textContent = 'Oops! ' + (data.message || 'Something went wrong. Please try again.');
            formStatus.className = 'form-status error';
          }

          setTimeout(() => {
            formStatus.className = 'form-status';
            formStatus.textContent = '';
          }, 5000);
        })
        .catch(error => {
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
          formStatus.textContent = 'Error: Failed to connect to the email API. Please check your internet connection or email directly.';
          formStatus.className = 'form-status error';

          setTimeout(() => {
            formStatus.className = 'form-status';
            formStatus.textContent = '';
          }, 5000);
        });
    });
  }
});

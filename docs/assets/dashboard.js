window.onload = async function () {
  
  // ========================================
  // CONSTANTS & CONFIGURATION
  // ========================================
  
  /** Namespace used for CSS classes to prevent collision */
  const NAMESPACE = 'momentum-dashboard';
  
  /** Dashboard DOM element */
  const dashboard = document.getElementById(NAMESPACE);
  
  /** Column IDs for consistent reference */
  const COLUMN_IDS = {
    input: `${NAMESPACE}-input`,
    pbcComponents: `${NAMESPACE}-pbc-components`,
    partners: `${NAMESPACE}-partners`,
    strategies: `${NAMESPACE}-strategies`,
    outputs: `${NAMESPACE}-outputs`,
    immediateOutputs: `${NAMESPACE}-immediate-outputs`,
    intermediateOutputs: `${NAMESPACE}-intermediate-outputs`,
    longTermOutputs: `${NAMESPACE}-long-term-outputs`
  };
  
  /** CSS class for data text elements */
  const TEXT_CLASS = `${NAMESPACE}-datum`;
  
  
  // ========================================
  // UTILITY FUNCTIONS
  // ========================================
  
  /*==============================*/
  // Creates a DOM element with namespace-aware ID and class
  /*==============================*/
  const createElement = (parent, type, id, className) => {
    const el = document.createElement(type);
    if (id) {
      el.id = `${NAMESPACE}-${id}`;
    }
    if (className) {
      el.className = `${NAMESPACE}-${className}`;
    }
    parent.appendChild(el);
    return el;
  };

  /*==============================*/
   // Adds a tooltip to an element using the TooltipManager
  /*==============================*/
  const addTooltip = (parent, tooltipText, root) => {
    return window.TooltipManager.addTooltip(parent, tooltipText, root, NAMESPACE);
  };

  /**
   * Filters a column to only show items connected to a given set of indices
   * @param {string} columnId - ID of the column to filter
   * @param {Set} connectedSet - Set of indices to show
   */
  const filterOutcomeColumn = (columnId, connectedSet) => {
    const column = document.getElementById(columnId);
    const columnChildren = column.getElementsByClassName(`${NAMESPACE}-data-wrapper`);
    [...columnChildren].forEach((child, idx) => {
      child.style.display = connectedSet.has(idx) ? 'block' : 'none';
    });
  };

  
  // ========================================
  // STATE MANAGEMENT
  // ========================================
  
  /** Global data object loaded from external source */
  let data = null;
  
  /** Array of strategy objects for easy access */
  let strategyList = [];
  
  /** FilterSystem state helpers */
  const isStrategySelected = () => window.FilterSystem.isStrategySelected();
  const isPartnerSelected = () => window.FilterSystem.isPartnerSelected();

  
  // ========================================
  // COLOR & STYLING WRAPPER FUNCTIONS
  // ========================================
  
  /** Gets the color for a PBC Component using ColorManager */
  const getPBCComponentColor = (pbcComponent) => {
    return window.ColorManager.getPBCColor(pbcComponent, data);
  };

  /** Generates a gradient based on a PBC component color */
  const createPBCGradient = (baseColor) => {
    return window.ColorManager.generatePBCGradient(baseColor);
  };

  /** Updates the entire dashboard's color scheme */
  const updateDashboardColors = (newGradient) => {
    const columnIds = Object.values(COLUMN_IDS);
    return window.ColorManager.updateBrandGradient(newGradient, NAMESPACE, columnIds, columns);
  };

  
  // ========================================
  // FILTER WRAPPER FUNCTIONS  
  // ========================================
  
  /** Filters the Partners column based on selected PBC Components */
  const applyPartnerFiltering = () => {
    return window.FilterManager.filterPartnersFromPBC(NAMESPACE, COLUMN_IDS.partners, data);
  };

  /** Clears all styling from Partner column items */
  const clearPartnerStyling = () => {
    return window.FilterManager.clearPartnerColumnColors(NAMESPACE, COLUMN_IDS.partners);
  };

  /**
   * Toggles column visibility and creates horizontal filter bars
   */
  const toggleColumnVisibility = (columnId, columnLabel, dataKey, colorIndex, hideColumn) => {
    const config = {
      columnId, columnLabel, dataKey, colorIndex, hideColumn,
      namespace: NAMESPACE, 
      strategiesId: COLUMN_IDS.strategies, 
      partnersId: COLUMN_IDS.partners, 
      outputsId: COLUMN_IDS.outputs, 
      immediateOutputsId: COLUMN_IDS.immediateOutputs, 
      intermediateOutputsId: COLUMN_IDS.intermediateOutputs, 
      longTermOutputsId: COLUMN_IDS.longTermOutputs,
      dashboard, dashboardWrapper, data, strategyValues: strategyList,
      addElement: createElement, 
      getPBCColor: getPBCComponentColor, 
      generatePBCGradient: createPBCGradient, 
      updateBrandGradient: updateDashboardColors, 
      updateButtonVisibility: updateNavigationButtons
    };
    return window.FilterManager.toggleColumn(config);
  };

  
  // ========================================
  // UI CREATION & LAYOUT
  // ========================================
  
  /** Create main dashboard layout containers */
  const dashboardWrapper = createElement(dashboard, 'div', 'body-wrapper');
  const headersWrapper = createElement(dashboardWrapper, 'div', 'header-wrapper');
  const columnsWrapper = createElement(dashboardWrapper, 'div', 'columns-wrapper');

  /** Initialize column configuration with default colors */
  const brandGradient = window.ColorManager.getOriginalBrandGradient();

  const columns = {
    [COLUMN_IDS.pbcComponents]: {
      columnColor: brandGradient[0],
      label: 'PBC Components',
    },
    [COLUMN_IDS.partners]: {
      columnColor: brandGradient[1],
      label: 'Partners',
    },
    [COLUMN_IDS.strategies]: {
      columnColor: brandGradient[2],
      label: 'Strategies',
    },
    [COLUMN_IDS.outputs]: {
      columnColor: brandGradient[3],
      label: 'Outputs',
    },
    [COLUMN_IDS.immediateOutputs]: {
      columnColor: brandGradient[4],
      label: 'Immediate Outcomes',
    },
    [COLUMN_IDS.intermediateOutputs]: {
      columnColor: brandGradient[5],
      label: 'Intermediate Outcomes',
    },
    [COLUMN_IDS.longTermOutputs]: {
      columnColor: brandGradient[6],
      label: 'Long-Term Outcomes',
    },
  };

  /*==============================*/
   //Creates a modal dialog for displaying strategy details
  /*==============================*/
  const createStrategyModal = () => {
    const modal = createElement(document.body, 'div', 'modal');
    modal.onclick = () => {
      modal.scrollTop = 0;
      modal.style.display = 'none';
    };

    const modalContent = createElement(modal, 'div', 'modal-content');
    modalContent.style.border = `6px solid ${window.ColorManager.getCurrentBrandGradient()[0]}`;
    modalContent.style.background = '#FFF';
    modalContent.onclick = e => e.stopPropagation();

    const closeWrapper = createElement(modalContent, 'div', 'close-wrapper');
    const closeButton = createElement(closeWrapper, 'button');
    closeButton.textContent = 'Close';
    closeButton.onclick = () => {
      modal.scrollTop = 0;
      modal.style.display = 'none';
    };

    const modalHeader = createElement(modalContent, 'div', 'modal-header');
    const researchWrapper = createElement(modalContent, 'div');
    const researchParagraph = createElement(researchWrapper, 'div');
    const researchBody = createElement(researchWrapper, 'div');
    
    return { modal, modalHeader, researchParagraph, researchBody };
  };

  const { modal, modalHeader, researchParagraph, researchBody } = createStrategyModal();

  
  // ========================================
  // DATA LOADING & PROCESSING
  // ========================================
  
  /** Load data using external DataLoader module */
  try {
    data = await window.DataLoader.loadData(dashboardWrapper, createElement, NAMESPACE);
    
    // Set strategy list for easy access
    strategyList = Object.values(data.strategies);
    
    // 🔍 DEBUG: Check strategy ordering
    console.log('🔍 Strategy Keys (what shows in column):', Object.keys(data.strategies));
    console.log('🔍 Strategy List (what modal uses):', strategyList.map(s => s.label));
    console.log('🔍 Activities in strategyList order:', strategyList.map(s => ({ label: s.label, activities: s.activities?.substring(0, 50) + '...' })));
    
    // Initialize FilterSystem with loaded data
    window.FilterSystem.init({
      namespace: NAMESPACE,
      columnIds: COLUMN_IDS,
      data: data,
      strategyList: strategyList
    });
  } catch (error) {
    console.error('Failed to load data:', error);
    return; // Stop execution if data loading fails
  }

  
  // ========================================
  // HEADER & COLUMN CREATION
  // ========================================
  
  /**
   * Creates an arrow-shaped header element for a column
   * @param {Object} config - Configuration object
   * @param {string} config.columnColor - Background color for the header
   * @param {string} config.label - Text label for the header
   * @param {string} config.tooltip - Tooltip text
   * @param {boolean} config.isLast - Whether this is the last header (no right arrow)
   */
  const createHeaderElement = ({ columnColor, label, tooltip, isLast }) => {
    const headerEl = createElement(headersWrapper, 'div', null, 'header');
    const labelWrapper = createElement(headerEl, 'div', null, 'header-label-wrapper');
    const labelInnerWrapper = createElement(labelWrapper, 'div');
    const headerText = createElement(labelInnerWrapper, 'h2');
    headerText.innerText = label + ' ';
    addTooltip(labelInnerWrapper, tooltip, dashboardWrapper);
    labelWrapper.style.background = columnColor;

    // Create the left side of the header arrows
    const arrowLeftEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    arrowLeftEl.setAttribute('width', '12px');
    arrowLeftEl.setAttribute('height', '100%');
    arrowLeftEl.setAttribute('viewBox', '0 0 100 100');
    arrowLeftEl.setAttribute('preserveAspectRatio', 'none');
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', '0,0 100,0 100,100 0,100 100,50 0,0');
    polygon.setAttribute('fill', columnColor);
    arrowLeftEl.appendChild(polygon);
    arrowLeftEl.style.position = 'absolute';
    headerEl.appendChild(arrowLeftEl);

    if (!isLast) {
      // Create the right side of the header arrows
      const arrowRightEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      arrowRightEl.setAttribute('width', '12px');
      arrowRightEl.setAttribute('height', '100%');
      arrowRightEl.setAttribute('viewBox', '0 0 100 100');
      arrowRightEl.setAttribute('preserveAspectRatio', 'none');
      const polygon2 = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      polygon2.setAttribute('points', '0,0 100,50 0,100 0,0');
      polygon2.setAttribute('fill', columnColor);
      arrowRightEl.appendChild(polygon2);
      Object.assign(arrowRightEl.style, {
        position: 'absolute',
        left: '100%',
      });
      headerEl.appendChild(arrowRightEl);
    }
  };

  // Create headers for all columns
  Object.entries(columns).map(([_, { columnColor, label }], i) => {
    createHeaderElement({
      columnColor,
      label,
      tooltip: data.headerTooltips[i],
      isLast: i === Object.entries(columns).length - 1,
    });
  });

  // Create wrapper column elements for each column
  const columnEls = Object.entries(columns).map(([id, { columnColor }]) => {
    const columnWrapper = createElement(columnsWrapper, 'div', null, 'column-wrapper');
    columnWrapper.id = id;
    columnWrapper.style.border = `1px solid ${columnColor}80`;
    columnWrapper.style.background = `${columnColor}1A`;
    return columnWrapper;
  });

  
  // ========================================
  // HOVER & HIGHLIGHT FUNCTIONALITY
  // ========================================
  
  /**
   * Removes hover highlights from partner elements and connected strategies
   */
  const clearPartnerHighlights = () => {
    if (isStrategySelected()) {
      return; // Don't clear highlights when a strategy is selected
    }
    
    // Clear partner highlights
    const partnersColumn = document.getElementById(COLUMN_IDS.partners);
    if (partnersColumn) {
      const partnersChildren = partnersColumn.getElementsByClassName(`${NAMESPACE}-data-wrapper`);
      [...partnersChildren].forEach(child => {
        const partnerTextElement = child.querySelector(`.${TEXT_CLASS}`);
        if (partnerTextElement) {
          partnerTextElement.style.background = 'transparent';
        }
      });
    }
    
    // Clear strategy wrapper highlights
    const strategiesColumn = document.getElementById(COLUMN_IDS.strategies);
    if (strategiesColumn) {
      const strategiesChildren = strategiesColumn.getElementsByClassName(`${NAMESPACE}-data-wrapper`);
      [...strategiesChildren].forEach(child => {
        child.style.background = 'transparent';
      });
    }
  };

  /**
   * Gets the primary PBC Component color for a specific strategy
   * @param {number} strategyIndex - Index of the strategy in strategyList
   * @returns {string} Hex color code
   */
  const getStrategyThemeColor = (strategyIndex) => {
    const strategy = strategyList[strategyIndex];
    if (strategy && strategy.pbcComponents && strategy.pbcComponents.length > 0) {
      // Get the first (primary) PBC Component for this strategy
      const primaryPBCIndex = strategy.pbcComponents[0];
      const primaryPBC = data.pbcComponents[primaryPBCIndex];
      return getPBCComponentColor(primaryPBC);
    }
    // Fallback to default Strategy color if no PBC Component found
    return columns[COLUMN_IDS.strategies].columnColor;
  };

  /**
   * Gets the currently active theme color based on dashboard state
   * @returns {string|null} Hex color code or null if no specific theme is active
   */
  const getActiveThemeColor = () => {
    // 1. Check if a PBC component is currently selected from the horizontal filter
    if (window.FilterManager.hasSelectedItems()) {
      const selectedPBC = Array.from(window.FilterManager.getSelectedItems())[0];
      return getPBCComponentColor(selectedPBC);
    }
    
    // 2. Check if a specific strategy is currently selected
    if (isStrategySelected()) {
      const strategiesColumn = document.getElementById(COLUMN_IDS.strategies);
      const strategiesChildren = strategiesColumn.getElementsByClassName(`${NAMESPACE}-data-wrapper`);
      
      // Find the currently visible (selected) strategy
      for (let i = 0; i < strategiesChildren.length; i++) {
        if (strategiesChildren[i].style.display !== 'none') {
          return getStrategyThemeColor(i);
        }
      }
    }
    
    // 3. Default: return null to indicate individual strategy colors should be used
    return null;
  };

  /**
   * Creates a hover highlight function for partner connections
   * @param {number} partnerIndex - Index of the partner to highlight
   * @returns {Function} Event handler function
   */
  const createPartnerHighlight = (partnerIndex) => () => {
    if (isStrategySelected()) {
      return; // Don't highlight when a strategy is already selected
    }
    
    // Find strategies connected to this partner (respecting current PBC filter)
    const connectedStrategies = [];
    strategyList.forEach((strategy, strategyIdx) => {
      if (strategy.partners && strategy.partners.includes(partnerIndex)) {
        // If a PBC component is selected, only include strategies that also match that PBC
        if (window.FilterManager.hasSelectedItems()) {
          const selectedPBC = Array.from(window.FilterManager.getSelectedItems())[0];
          const strategyPBCs = (strategy.pbcComponents || []).map(idx => data.pbcComponents[idx]);
          if (strategyPBCs.includes(selectedPBC)) {
        connectedStrategies.push(strategyIdx);
          }
        } else {
          // No PBC filter active, include all strategies for this partner
          connectedStrategies.push(strategyIdx);
        }
      }
    });
    
    // Determine highlight color: use gray for "All Pillars" mode, otherwise use theme color
    let highlightColor;
    
    // Check if we're in "All Pillars" mode (no PBC selected)
    if (window.FilterSystem && window.FilterSystem.isPBCSelected && !window.FilterSystem.isPBCSelected()) {
      // "All Pillars" mode - use gray for partner hover highlights
      highlightColor = '#6B7280';
    } else {
      // PBC mode - use existing logic
      const themeColor = getActiveThemeColor();
      
      if (themeColor) {
        // Use the current theme color for consistent highlighting
        highlightColor = themeColor;
      } else if (connectedStrategies.length > 0) {
        // Use the first connected strategy's PBC color
        highlightColor = getStrategyThemeColor(connectedStrategies[0]);
      } else {
        // Fallback to Partners column color
        highlightColor = columns[COLUMN_IDS.partners].columnColor;
      }
    }
    
    // Highlight the hovered partner itself
    const partnersColumn = document.getElementById(COLUMN_IDS.partners);
    const partnersChildren = partnersColumn.getElementsByClassName(`${NAMESPACE}-data-wrapper`);
    if (partnersChildren[partnerIndex]) {
      const partnerTextElement = partnersChildren[partnerIndex].querySelector(`.${TEXT_CLASS}`);
      if (partnerTextElement) {
        partnerTextElement.style.background = `${highlightColor}50`;
      }
    }
    
    // Highlight strategies connected to this partner using consistent color
    const strategiesColumn = document.getElementById(COLUMN_IDS.strategies);
    const strategiesChildren = strategiesColumn.getElementsByClassName(`${NAMESPACE}-data-wrapper`);
    connectedStrategies.forEach(strategyIdx => {
      if (strategiesChildren[strategyIdx]) {
        strategiesChildren[strategyIdx].style.background = `${highlightColor}50`;
      }
    });
  };

  
  // ========================================
  // MAIN FILTER & SELECTION FUNCTIONS
  // ========================================
  
  /**
   * Clears all filters and shows all columns
   */
  const clearAllFilters = () => {
    window.FilterSystem.clearAllFilters();
    updateNavigationButtons();
  };

  /**
   * Shows only a specific strategy and its connected elements
   * @param {number} strategyIndex - Index of strategy to show
   * @returns {Function} Event handler function
   */
  const selectStrategy = (strategyIndex) => () => {
    window.FilterSystem.selectStrategy(strategyIndex);
    updateNavigationButtons();
  };

  /**
   * Shows only a specific partner and its connected elements
   * @param {number} partnerIndex - Index of partner to show
   * @returns {Function} Event handler function
   */
  const selectPartner = (partnerIndex) => () => {
    window.FilterSystem.selectPartner(partnerIndex);
    updateNavigationButtons();
  };

  
  // ========================================
  // NAVIGATION BUTTON MANAGEMENT
  // ========================================
  
  /** Navigation buttons for filtering controls */
    const strategiesColumn = document.getElementById(COLUMN_IDS.strategies);
  const partnersColumn = document.getElementById(COLUMN_IDS.partners);
  const showAllPartnerStrategiesButton = document.createElement('button');
  const showAllPBCStrategiesButton = document.createElement('button');
  const showAllPBCPartnersButton = document.createElement('button');

  /**
   * Updates the visibility and text of navigation buttons based on current filter state
   */
  const updateNavigationButtons = () => {
    const config = {
      showAllPartnerStrategiesButton, 
      showAllPBCStrategiesButton, showAllPBCPartnersButton,
      clickedStrategy: isStrategySelected(), 
      clickedPartner: isPartnerSelected(), 
      namespace: NAMESPACE, 
      partnersId: COLUMN_IDS.partners, 
      data
    };
    return window.FilterManager.updateButtonVisibility(config);
  };

  /**
   * Shows all strategies for the currently selected partner
   */
  const showAllPartnerStrategies = () => {
    window.FilterSystem.showAllPartnerStrategies();
    updateNavigationButtons();
  };

  /**
   * Shows all partners for the currently selected PBC component
   */
  const showAllPBCPartners = () => {
    window.FilterSystem.showAllPBCPartners();
    updateNavigationButtons();
  };

  /**
   * Shows all strategies for the currently selected PBC component
   */
  const showAllPBCStrategies = () => {
    window.FilterSystem.showAllPBCStrategies();
    updateNavigationButtons();
  };

  
  // ========================================
  // MODAL & INTERACTION HANDLERS
  // ========================================
  
  /**
   * Creates a function to show the strategy details modal
   * @param {number} strategyIndex - Index of the strategy to show details for
   * @returns {Function} Event handler function
   */
      const createStrategyModalHandler = (strategyIndex) => () => {
    modalHeader.innerText = strategyList[strategyIndex].label;

    // Clear existing content - more thorough clearing
    researchBody.innerHTML = ''; // Complete clear instead of selective removal

    // Show Impact Goal
    const strategy = strategyList[strategyIndex];
    
    // Create header
    const goalHeader = createElement(researchBody, 'div', 'goal-header');
    goalHeader.innerText = 'Impact Goal';
    
    // Create goal content
    const goalContent = createElement(researchBody, 'div', null, 'goal-content');
    
    // Since Impact Goal is the same for all strategies, we can use the first one
    const impactGoal = data.impactGoal;
    
    if (impactGoal && impactGoal.trim()) {
      goalContent.innerText = impactGoal;
    } else {
      goalContent.innerText = 'No impact goal available.';
    }

    modal.style.display = 'block';
  };

  
  // ========================================
  // COLUMN DATA POPULATION
  // ========================================
  
  /**
   * Populates a column with data items and sets up appropriate interactions
   * @param {Array} data - Array of data items to display
   * @param {string} columnId - ID of the column to populate
   * @param {Array} tooltips - Optional array of tooltip texts
   */
  const populateColumn = (data, columnId, tooltips) => {
    data.forEach((datum, i) => {
      const wrapperDiv = document.createElement('div');
      document.getElementById(columnId).appendChild(wrapperDiv);

      const dataDiv = document.createElement('div');
      dataDiv.className = `${NAMESPACE}-data-wrapper`;
      if (i !== data.length - 1) {
        dataDiv.style.borderBottom = `1px solid ${columns[columnId].columnColor}80`;
      }
      wrapperDiv.appendChild(dataDiv);

      if (columnId === COLUMN_IDS.strategies) {
        // Special handling for strategy items
        const button = document.createElement('button');
        button.className = `${TEXT_CLASS} ${NAMESPACE}-button`;
        button.textContent = datum;
        button.style.paddingTop = '14px'; // Extra padding for the PBC color pill
        dataDiv.appendChild(button);

        // Create colored pill for PBC component spanning full width of strategy box
        const colorPill = document.createElement('div');
        colorPill.style.position = 'absolute';
        colorPill.style.top = '8px';
        colorPill.style.left = '0';
        colorPill.style.right = '0';
        colorPill.style.height = '8px';
        colorPill.style.backgroundColor = getStrategyThemeColor(i);
        colorPill.style.borderRadius = '4px';
        colorPill.style.zIndex = '10';
        
        // Make dataDiv relatively positioned to contain the absolute pill
        dataDiv.style.position = 'relative';
        dataDiv.appendChild(colorPill);

        const filterButtonWrapper = document.createElement('div');
        filterButtonWrapper.className = `${NAMESPACE}-filter-button-wrapper`;
        const filterButton = document.createElement('button');
        filterButton.className = `${NAMESPACE}-filter-button`;
        filterButton.textContent = 'Learn more';
        filterButtonWrapper.appendChild(filterButton);
        dataDiv.appendChild(filterButtonWrapper);

        // Set up event handlers
        button.onclick = selectStrategy(i);
        filterButton.onclick = createStrategyModalHandler(i);
        
        // Add hover functionality to highlight connected outcomes
        const highlightStrategyConnections = () => {
          if (isStrategySelected()) return; // Don't highlight when strategy is already selected
          
          const strategy = strategyList[i];
          // Use theme color if available, otherwise use individual strategy color
          const themeColor = getActiveThemeColor();
          const strategyColor = themeColor || getStrategyThemeColor(i);
          
          // Highlight the strategy itself
          dataDiv.setAttribute('data-original-bg-before-hover', dataDiv.style.background || '');
          dataDiv.style.background = `${strategyColor}50`;
          
          // Helper function to highlight outcome items
          const highlightOutcomeItems = (columnId, indices) => {
            if (!indices || indices.length === 0) return;
            
            const column = document.getElementById(columnId);
            const columnChildren = column.getElementsByClassName(`${NAMESPACE}-data-wrapper`);
            
            indices.forEach(idx => {
              if (columnChildren[idx]) {
                const textElement = columnChildren[idx].querySelector(`.${TEXT_CLASS}`);
                if (textElement) {
                  textElement.setAttribute('data-original-bg-before-hover', textElement.style.background || '');
                  textElement.style.background = `${strategyColor}50`;
                }
              }
            });
          };
          
          // Highlight all connected outcomes
          highlightOutcomeItems(COLUMN_IDS.outputs, strategy.outputs);
          highlightOutcomeItems(COLUMN_IDS.immediateOutputs, strategy.immediateOutputs);
          highlightOutcomeItems(COLUMN_IDS.intermediateOutputs, strategy.intermediateOutputs);
          highlightOutcomeItems(COLUMN_IDS.longTermOutputs, strategy.longTermOutputs);
        };
        
        const clearStrategyHighlights = () => {
          if (isStrategySelected()) return; // Don't clear when strategy is selected
          
          // Restore strategy background
          const originalBg = dataDiv.getAttribute('data-original-bg-before-hover') || '';
          dataDiv.style.background = originalBg || 'transparent';
          
          // Restore outcome backgrounds
          const allOutcomeColumns = [COLUMN_IDS.outputs, COLUMN_IDS.immediateOutputs, COLUMN_IDS.intermediateOutputs, COLUMN_IDS.longTermOutputs];
          allOutcomeColumns.forEach(columnId => {
            const column = document.getElementById(columnId);
            if (column) {
              const columnChildren = column.getElementsByClassName(`${NAMESPACE}-data-wrapper`);
              [...columnChildren].forEach(child => {
                const textElement = child.querySelector(`.${TEXT_CLASS}`);
                if (textElement) {
                  const originalChildBg = textElement.getAttribute('data-original-bg-before-hover') || '';
                  textElement.style.background = originalChildBg || 'transparent';
                }
              });
            }
          });
        };
        
        // Attach hover events
        button.onmouseenter = highlightStrategyConnections;
        button.onmouseleave = clearStrategyHighlights;
        
      } else {
        // Standard text item handling
        const textDiv = document.createElement('div');
        textDiv.className = TEXT_CLASS;
        dataDiv.appendChild(textDiv);
        textDiv.innerText = datum;
        if (tooltips) {
          addTooltip(textDiv, tooltips[i], dashboardWrapper);
        }
        
        // Add click functionality for Partners column
        if (columnId === COLUMN_IDS.partners) {
          dataDiv.onclick = selectPartner(i);
          dataDiv.style.cursor = 'pointer';
          
          // Add hover functionality
          dataDiv.onmouseenter = createPartnerHighlight(i);
          dataDiv.onmouseleave = clearPartnerHighlights;
        }
        
        // Add hover functionality for outcome columns to highlight strategies
        const highlightRelatedStrategies = () => {
          if (isStrategySelected()) return; // Don't highlight when strategy is selected
          
          // Find strategies that are connected to this item
          const connectedStrategies = [];
          strategyList.forEach((strategy, strategyIdx) => {
            let isConnected = false;
            
            if (columnId === COLUMN_IDS.outputs && strategy.outputs.includes(i)) {
              isConnected = true;
            } else if (columnId === COLUMN_IDS.immediateOutputs && strategy.immediateOutputs.includes(i)) {
              isConnected = true;
            } else if (columnId === COLUMN_IDS.intermediateOutputs && strategy.intermediateOutputs.includes(i)) {
              isConnected = true;
            } else if (columnId === COLUMN_IDS.longTermOutputs && strategy.longTermOutputs.includes(i)) {
              isConnected = true;
            }
            
            if (isConnected) {
              connectedStrategies.push(strategyIdx);
            }
          });
          
          // Determine highlight color
          const themeColor = getActiveThemeColor();
          let highlightColor;
          
          if (themeColor) {
            highlightColor = themeColor;
          } else if (connectedStrategies.length > 0) {
            highlightColor = getStrategyThemeColor(connectedStrategies[0]);
          } else {
            highlightColor = columns[COLUMN_IDS.strategies].columnColor;
          }
          
          // Highlight the hovered outcome item
          textDiv.setAttribute('data-original-bg-before-hover', textDiv.style.background || '');
          textDiv.style.background = `${highlightColor}50`;
          
          // Highlight connected strategies
          const strategiesColumn = document.getElementById(COLUMN_IDS.strategies);
          const strategiesChildren = strategiesColumn.getElementsByClassName(`${NAMESPACE}-data-wrapper`);
          connectedStrategies.forEach(strategyIdx => {
            if (strategiesChildren[strategyIdx]) {
              strategiesChildren[strategyIdx].setAttribute('data-original-bg-before-hover', strategiesChildren[strategyIdx].style.background || '');
              strategiesChildren[strategyIdx].style.background = `${highlightColor}50`;
            }
          });
        };
        
        const clearItemHighlights = () => {
          if (isStrategySelected()) return; // Don't clear when strategy is selected
          
          // Restore original background for the hovered outcome item
          const originalItemBg = textDiv.getAttribute('data-original-bg-before-hover') || '';
          textDiv.style.background = originalItemBg || 'transparent';
          
          // Clear highlights from strategies column
          const strategiesColumn = document.getElementById(COLUMN_IDS.strategies);
          if (strategiesColumn) {
            const strategiesChildren = [...strategiesColumn.getElementsByClassName(`${NAMESPACE}-data-wrapper`)];
            strategiesChildren.forEach(child => {
              const originalChildBg = child.getAttribute('data-original-bg-before-hover') || '';
              child.style.background = originalChildBg || 'transparent';
            });
          }
        };
        
        // Add hover events (only for outcome columns)
        const outcomeColumns = [COLUMN_IDS.outputs, COLUMN_IDS.immediateOutputs, COLUMN_IDS.intermediateOutputs, COLUMN_IDS.longTermOutputs];
        if (outcomeColumns.includes(columnId)) {
          dataDiv.onmouseenter = highlightRelatedStrategies;
          dataDiv.onmouseleave = clearItemHighlights;
        }
      }
    });
  };

  
  // ========================================
  // BUTTON SETUP & INITIALIZATION
  // ========================================
  
  // Set up contextual navigation buttons only
  showAllPartnerStrategiesButton.className = `${NAMESPACE}-see-all`;
  showAllPartnerStrategiesButton.style.display = 'none';
  showAllPartnerStrategiesButton.textContent = '← Show all Strategies for this Partner';
  showAllPartnerStrategiesButton.style.marginTop = '10px';
  strategiesColumn.appendChild(showAllPartnerStrategiesButton);
  showAllPartnerStrategiesButton.onclick = showAllPartnerStrategies;

  showAllPBCStrategiesButton.className = `${NAMESPACE}-see-all`;
  showAllPBCStrategiesButton.style.display = 'none';
  showAllPBCStrategiesButton.textContent = '← Show all Strategies for this PBC Component';
  showAllPBCStrategiesButton.style.marginTop = '10px';
  strategiesColumn.appendChild(showAllPBCStrategiesButton);
  showAllPBCStrategiesButton.onclick = () => {
    // Check if we're in "All Pillars" mode or PBC mode
    if (window.FilterSystem.isPBCSelected()) {
      // PBC mode - go back to PBC strategies view
      showAllPBCStrategies();
    } else {
      // "All Pillars" mode - clear all filters
      clearAllFilters();
    }
  };

  showAllPBCPartnersButton.className = `${NAMESPACE}-see-all`;
  showAllPBCPartnersButton.style.display = 'none';
  showAllPBCPartnersButton.textContent = '← Show All Partners for this PBC Component';
  partnersColumn.appendChild(showAllPBCPartnersButton);
  showAllPBCPartnersButton.onclick = () => {
    // Check if we're in "All Pillars" mode or PBC mode
    if (window.FilterSystem.isPBCSelected()) {
      // PBC mode - go back to PBC partners view
      showAllPBCPartners();
    } else {
      // "All Pillars" mode - clear all filters
      clearAllFilters();
    }
  };

  // Populate all columns with data
  populateColumn(data.pbcComponents, COLUMN_IDS.pbcComponents);
  populateColumn(data.partners, COLUMN_IDS.partners);
  populateColumn(Object.keys(data.strategies), COLUMN_IDS.strategies);
  populateColumn(data.outputs, COLUMN_IDS.outputs);
  populateColumn(data.immediateOutputs, COLUMN_IDS.immediateOutputs);
  populateColumn(data.intermediateOutputs, COLUMN_IDS.intermediateOutputs);
  populateColumn(data.longTermOutputs, COLUMN_IDS.longTermOutputs);

  
  // ========================================
  // INITIAL SETUP & AUTO-SELECTION
  // ========================================
  
  // Hide PBC Components column by default and create horizontal filter
  toggleColumnVisibility(COLUMN_IDS.pbcComponents, 'PBC Components', 'pbcComponents', 0, true);
  
  // Auto-select the first PBC component on load
  setTimeout(() => {
    if (data.pbcComponents && data.pbcComponents.length > 0) {
      window.FilterSystem.selectPBC(data.pbcComponents[0]);
    }
  }, 100);

  
  // ========================================
  // FOOTER
  // ========================================
  
  /** Create footer with attribution */
  const createFooter = () => {
    const footer = createElement(dashboard, 'div', 'footer');
    const footerText = createElement(footer, 'div');
    footerText.innerText = 'Built and maintained by';
    const footerLink = createElement(footer, 'a');
    footerLink.setAttribute('href', 'http://www.januaryadvisors.com');
    footerLink.setAttribute('rel', 'noopener noreferrer');
    footerLink.setAttribute('target', '_blank');
    const footerLogo = createElement(footerLink, 'img');
    footerLogo.src = './assets/logo.svg';
  };
  
  createFooter();
};

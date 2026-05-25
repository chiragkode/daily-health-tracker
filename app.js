// Chirag's Fitness Coach State Manager

// Helper to format date in YYYY-MM-DD
function getLocalDateString(date = new Date()) {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
}

// Target elements
const calorieCircle = document.getElementById('calorie-progress-circle');
const netRemainingVal = document.getElementById('net-remaining-val');
const remainingLabelText = document.getElementById('remaining-label-text');
const budgetPillText = document.getElementById('budget-pill-text');
const consumedVal = document.getElementById('consumed-val');
const burnedVal = document.getElementById('burned-val');
const waterVal = document.getElementById('water-val');
const currentDateText = document.getElementById('current-date-text');
const recommendationsContainer = document.getElementById('recommendations-container');
const logsListContainer = document.getElementById('logs-list-container');
const emptyLogsMsg = document.getElementById('empty-logs-msg');

// Forms & Modals
const foodForm = document.getElementById('food-form');
const exerciseForm = document.getElementById('exercise-form');
const profileForm = document.getElementById('profile-form');
const profileModal = document.getElementById('profile-modal');
const profilePillTrigger = document.getElementById('profile-pill-trigger');
const closeProfileModalBtn = document.getElementById('close-profile-modal');

const clearDayBtn = document.getElementById('clear-day-btn');
const prevDayBtn = document.getElementById('prev-day-btn');
const nextDayBtn = document.getElementById('next-day-btn');
const waterResetBtn = document.getElementById('water-reset-btn');

// View containers — declared early so all handlers can access them
const viewTodayBtn = document.getElementById('view-today-btn');
const viewWeeklyBtn = document.getElementById('view-weekly-btn');
const dailyViewContainer = document.getElementById('daily-view-container');
const weeklyViewContainer = document.getElementById('weekly-view-container');

const profAiProvider = document.getElementById('prof-ai-provider');
const geminiKeyGroup = document.getElementById('gemini-key-group');
const groqKeyGroup = document.getElementById('groq-key-group');
const openrouterKeyGroup = document.getElementById('openrouter-key-group');

const defaultProfile = {
    weight: 90,
    height: 67, // inches (approx 170cm)
    age: 29,
    sex: 'male',
    activityLevel: 1.2,
    goalType: 'maintenance',
    customGoal: 2000,
    isVegetarian: true,
    geminiApiKey: '',
    aiProvider: 'gemini',
    groqApiKey: '',
    openrouterApiKey: '',
    lastWeightCheckDate: null,
    transformGoal: {
        active: false,
        targetLoss: 10,       // kg
        timelineMonths: 3,
        startDate: null,      // YYYY-MM-DD
        startWeight: null,    // kg at goal start
        dailyDeficit: 0,      // kcal/day
        planText: ''          // last AI plan HTML
    }
};

let userProfile = JSON.parse(localStorage.getItem('chirag_profile')) || defaultProfile;
let currentDayOffset = 0; // 0 for today, -1 for yesterday, etc.
let activeDateStr = getLocalDateString();

// Database of common Indian Vegetarian foods with their calorie values
const VEG_MENU = [
    { name: "Roti (1 pc)", calories: 80, protein: 3, fat: 0.5, carbs: 15, meal: "Lunch" },
    { name: "Butter Roti (1 pc)", calories: 120, protein: 3.2, fat: 4.5, carbs: 16.5, meal: "Lunch" },
    { name: "Plain Paratha (1 pc)", calories: 150, protein: 3.5, fat: 6, carbs: 21, meal: "Breakfast" },
    { name: "Aloo Paratha (1 pc)", calories: 290, protein: 5.8, fat: 11, carbs: 42, meal: "Breakfast" },
    { name: "Dal Tadka / Fry (1 bowl)", calories: 150, protein: 7.5, fat: 5, carbs: 19, meal: "Lunch" },
    { name: "Basmati Rice (1 bowl)", calories: 200, protein: 4.2, fat: 0.4, carbs: 44, meal: "Lunch" },
    { name: "Khichdi (1 bowl)", calories: 220, protein: 6.8, fat: 4.5, carbs: 38, meal: "Dinner" },
    { name: "Idli (2 pcs) with Sambar", calories: 180, protein: 5.5, fat: 1.2, carbs: 36, meal: "Breakfast" },
    { name: "Plain Dosa with Sambar", calories: 250, protein: 5.2, fat: 6.5, carbs: 42, meal: "Breakfast" },
    { name: "Masala Dosa with Sambar", calories: 350, protein: 6.5, fat: 10, carbs: 58, meal: "Breakfast" },
    { name: "Poha (1 plate)", calories: 250, protein: 4.5, fat: 7.8, carbs: 41, meal: "Breakfast" },
    { name: "Upma (1 plate)", calories: 220, protein: 4.8, fat: 6.2, carbs: 36, meal: "Breakfast" },
    { name: "Chole Bhature (1 plate)", calories: 600, protein: 12.5, fat: 28, carbs: 75, meal: "Lunch" },
    { name: "Pav Bhaji (1 plate)", calories: 450, protein: 8.5, fat: 16, carbs: 68, meal: "Dinner" },
    { name: "Veg Biryani (1 plate)", calories: 300, protein: 6.5, fat: 8.5, carbs: 50, meal: "Lunch" },
    { name: "Vegetable Pulao (1 bowl)", calories: 240, protein: 4.8, fat: 5.8, carbs: 42, meal: "Dinner" },
    { name: "Mix Veg Sabzi (1 bowl)", calories: 120, protein: 2.8, fat: 6.5, carbs: 13, meal: "Lunch" },
    { name: "Paneer Butter Masala (1 bowl)", calories: 280, protein: 10.5, fat: 22, carbs: 10, meal: "Lunch" },
    { name: "Palak Paneer (1 bowl)", calories: 220, protein: 9.8, fat: 15, carbs: 8.5, meal: "Dinner" },
    { name: "Rajma Chawal (1 plate)", calories: 400, protein: 11.5, fat: 6.8, carbs: 72, meal: "Lunch" },
    { name: "Chole Rice (1 plate)", calories: 410, protein: 10.8, fat: 7.2, carbs: 75, meal: "Lunch" },
    { name: "Samosa (1 pc)", calories: 150, protein: 2.5, fat: 9, carbs: 16, meal: "Snack" },
    { name: "Dhokla (2 pcs)", calories: 120, protein: 4.5, fat: 3.2, carbs: 18, meal: "Breakfast" },
    { name: "Sheera / Halwa (1 plate)", calories: 500, protein: 4.8, fat: 18, carbs: 78, meal: "Snack" },
    { name: "Gajar Halwa (1 bowl)", calories: 300, protein: 4.2, fat: 12, carbs: 44, meal: "Snack" },
    { name: "Greek Yogurt / Curd (1 cup)", calories: 100, protein: 8.5, fat: 3.2, carbs: 6, meal: "Snack" },
    { name: "Buttermilk / Chaas (1 glass)", calories: 45, protein: 2.2, fat: 1.5, carbs: 4.8, meal: "Lunch" },
    { name: "Cucumber Salad (1 bowl)", calories: 30, protein: 0.8, fat: 0.2, carbs: 6.2, meal: "Lunch" },
    { name: "Moong Dal Sprouts (1 cup)", calories: 120, protein: 8.2, fat: 0.6, carbs: 21, meal: "Snack" },
    { name: "Iced Americano (1 tall)", calories: 5, protein: 0.2, fat: 0, carbs: 0.8, meal: "Snack" }
];

// All daily logs — keyed by YYYY-MM-DD date strings
let dailyLogs = JSON.parse(localStorage.getItem('chirag_logs')) || {};

// ---------------------------------------------------------------------
// Core Calculations (Mifflin-St Jeor)
// ---------------------------------------------------------------------
function calculateTDEE() {
    const weightKg = parseFloat(userProfile.weight);
    // Height in inches converted to cm (1 inch = 2.54 cm)
    const heightCm = parseFloat(userProfile.height) * 2.54;
    const age = parseInt(userProfile.age);
    const sex = userProfile.sex;
    const activityMultiplier = parseFloat(userProfile.activityLevel);

    // Mifflin-St Jeor Equation
    let bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age);
    if (sex === 'male') {
        bmr += 5;
    } else {
        bmr -= 161;
    }

    const tdee = Math.round(bmr * activityMultiplier);
    return tdee;
}

function getCalorieBudget() {
    const tdee = calculateTDEE();
    const tg = userProfile.transformGoal;
    // If an active transformation goal exists, compute deficit from it
    if (tg && tg.active && tg.targetLoss && tg.timelineMonths) {
        const totalDays = tg.timelineMonths * 30;
        const requiredDeficit = Math.round((tg.targetLoss * 7700) / totalDays);
        const safeDeficit = Math.min(requiredDeficit, 1000); // never more than 1000 kcal/day
        return Math.max(1200, tdee - safeDeficit);           // never below 1200
    }
    if (userProfile.goalType === 'deficit') return tdee - 500;
    if (userProfile.goalType === 'custom') return parseInt(userProfile.customGoal) || 2000;
    return tdee;
}

function calculateBMI() {
    const weightKg = parseFloat(userProfile.weight) || 90;
    const heightM = (parseFloat(userProfile.height) * 2.54) / 100;
    if (heightM <= 0) return 0;
    return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

function getMacroSplitPercentages(bmi) {
    const tg = userProfile.transformGoal;
    // Weight-loss goal → high-protein split to preserve muscle in deficit
    if (tg && tg.active) {
        return { protein: 35, carbs: 35, fat: 30, label: `Lose ${tg.targetLoss}kg Goal` };
    }
    if (bmi < 18.5) return { protein: 20, carbs: 50, fat: 30, label: "Underweight" };
    if (bmi < 25)   return { protein: 22, carbs: 50, fat: 28, label: "Normal" };
    if (bmi < 30)   return { protein: 25, carbs: 45, fat: 30, label: "Overweight" };
    return { protein: 30, carbs: 40, fat: 30, label: "Obese" };
}

// Compute goal status: days elapsed, weight lost, on-track assessment
function getGoalStatus() {
    const tg = userProfile.transformGoal;
    if (!tg || !tg.active || !tg.startDate) return null;
    const start = new Date(tg.startDate);
    const today = new Date();
    const daysElapsed = Math.max(0, Math.floor((today - start) / 86400000));
    const totalDays = tg.timelineMonths * 30;
    const daysRemaining = Math.max(0, totalDays - daysElapsed);
    const weightLost = tg.startWeight ? Math.max(0, Math.round((tg.startWeight - parseFloat(userProfile.weight)) * 10) / 10) : 0;
    const expectedLossToDate = Math.round(((tg.targetLoss / totalDays) * daysElapsed) * 10) / 10;
    const endDate = new Date(start);
    endDate.setDate(endDate.getDate() + totalDays);
    const endDateStr = endDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    let status = 'on-track';
    if (daysElapsed > 7 && weightLost < expectedLossToDate * 0.6) status = 'off-track';
    else if (daysElapsed > 7 && weightLost < expectedLossToDate * 0.85) status = 'behind';
    return { daysElapsed, totalDays, daysRemaining, weightLost, expectedLossToDate, endDateStr, status };
}

// ---------------------------------------------------------------------
// UI Rendering Elements
// ---------------------------------------------------------------------

// Format standard date text (e.g. "Today, May 25")
function updateDateDisplay() {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + currentDayOffset);
    activeDateStr = getLocalDateString(targetDate);
    
    const options = { month: 'short', day: 'numeric' };
    const dateFormatted = targetDate.toLocaleDateString('en-US', options);

    if (currentDayOffset === 0) {
        currentDateText.innerText = `Today, ${dateFormatted}`;
    } else if (currentDayOffset === -1) {
        currentDateText.innerText = `Yesterday, ${dateFormatted}`;
    } else if (currentDayOffset === 1) {
        currentDateText.innerText = `Tomorrow, ${dateFormatted}`;
    } else {
        currentDateText.innerText = `${targetDate.toLocaleDateString('en-US', { weekday: 'short', ...options })}`;
    }
}

// Progress ring animation
function setProgress(percent) {
    const circumference = 565.48; // 2 * PI * R
    let offset = circumference - (percent / 100) * circumference;
    
    // Clamp offset
    if (offset < 0) offset = 0;
    if (offset > circumference) offset = circumference;
    
    calorieCircle.style.strokeDashoffset = offset;
}

// Estimate macronutrients from calories if not found (MyFitnessPal split: 20% P, 50% C, 30% F)
function estimateMacrosFromCals(cals) {
    const p = Math.round((cals * 0.20 / 4) * 10) / 10;
    const c = Math.round((cals * 0.50 / 4) * 10) / 10;
    const f = Math.round((cals * 0.30 / 9) * 10) / 10;
    return { protein: p, fat: f, carbs: c };
}

// Render Dashboard Data
function renderDashboard() {
    // Get logs for the current date or generate an empty skeleton
    if (!dailyLogs[activeDateStr]) {
        dailyLogs[activeDateStr] = { food: [], exercise: [], water: 0 };
    }
    
    const dayData = dailyLogs[activeDateStr];
    
    // Sum Consumed
    const totalConsumed = dayData.food.reduce((sum, item) => sum + parseInt(item.calories || 0), 0);
    // Sum Burned
    const totalBurned = dayData.exercise.reduce((sum, item) => sum + parseInt(item.calories || 0), 0);
    // Water
    const totalWater = dayData.water || 0;

    // Budget Calculations
    const budget = getCalorieBudget();
    const netCalories = totalConsumed - totalBurned;
    const netRemaining = budget - netCalories;

    // DOM Updates
    consumedVal.innerHTML = `${totalConsumed} <span class="stat-unit">kcal</span>`;
    burnedVal.innerHTML = `${totalBurned} <span class="stat-unit">kcal</span>`;
    waterVal.innerHTML = `${totalWater} <span class="stat-unit">ml</span>`;
    document.getElementById('water-total-display').innerText = `${totalWater} ml`;
    
    budgetPillText.innerText = `Goal: ${budget} kcal`;

    if (netRemaining >= 0) {
        netRemainingVal.innerText = Math.round(netRemaining).toLocaleString();
        remainingLabelText.innerText = "kcal Remaining";
        remainingLabelText.style.color = 'var(--text-secondary)';
        
        // Progress percent
        const percent = Math.min(100, (netCalories / budget) * 100);
        setProgress(percent > 0 ? percent : 0);
        calorieCircle.style.stroke = 'url(#emerald-gradient)';
    } else {
        netRemainingVal.innerText = Math.round(Math.abs(netRemaining)).toLocaleString();
        remainingLabelText.innerText = "kcal Over Limit";
        remainingLabelText.style.color = 'var(--accent-rose)';
        
        setProgress(100);
        // Turn ring red/rose to alert user
        calorieCircle.style.stroke = 'var(--accent-rose)';
    }

    // Sum Macros (MyFitnessPal Style)
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFats = 0;

    dayData.food.forEach(item => {
        if (item.protein === undefined && item.fat === undefined && item.carbs === undefined) {
            const est = estimateMacrosFromCals(item.calories);
            item.protein = est.protein;
            item.fat = est.fat;
            item.carbs = est.carbs;
        }
        totalProtein += parseFloat(item.protein || 0);
        totalCarbs += parseFloat(item.carbs || 0);
        totalFats += parseFloat(item.fat || 0);
    });

    totalProtein = Math.round(totalProtein * 10) / 10;
    totalCarbs = Math.round(totalCarbs * 10) / 10;
    totalFats = Math.round(totalFats * 10) / 10;

    const bmi = calculateBMI();
    const splits = getMacroSplitPercentages(bmi);

    const proteinTarget = Math.round(budget * (splits.protein / 100) / 4);
    const carbsTarget = Math.round(budget * (splits.carbs / 100) / 4);
    const fatsTarget = Math.round(budget * (splits.fat / 100) / 9);

    // Update macro splits text on dashboard
    const ratioElem = document.getElementById('macro-cals-ratio');
    if (ratioElem) {
        ratioElem.innerText = `P: ${splits.protein}% • C: ${splits.carbs}% • F: ${splits.fat}% (${splits.label} split)`;
    }

    const proteinDiff = Math.round((proteinTarget - totalProtein) * 10) / 10;
    const carbsDiff = Math.round((carbsTarget - totalCarbs) * 10) / 10;
    const fatsDiff = Math.round((fatsTarget - totalFats) * 10) / 10;

    const proteinLabel = proteinDiff >= 0 ? `${totalProtein}g of ${proteinTarget}g (${proteinDiff}g left)` : `${totalProtein}g of ${proteinTarget}g (${Math.abs(proteinDiff)}g over)`;
    const carbsLabel = carbsDiff >= 0 ? `${totalCarbs}g of ${carbsTarget}g (${carbsDiff}g left)` : `${totalCarbs}g of ${carbsTarget}g (${Math.abs(carbsDiff)}g over)`;
    const fatsLabel = fatsDiff >= 0 ? `${totalFats}g of ${fatsTarget}g (${fatsDiff}g left)` : `${totalFats}g of ${fatsTarget}g (${Math.abs(fatsDiff)}g over)`;

    document.getElementById('macro-protein-val').innerText = proteinLabel;
    document.getElementById('macro-carbs-val').innerText = carbsLabel;
    document.getElementById('macro-fats-val').innerText = fatsLabel;

    const proteinPercent = Math.min(100, Math.round((totalProtein / proteinTarget) * 100)) || 0;
    const carbsPercent = Math.min(100, Math.round((totalCarbs / carbsTarget) * 100)) || 0;
    const fatsPercent = Math.min(100, Math.round((totalFats / fatsTarget) * 100)) || 0;

    document.getElementById('macro-protein-bar').style.width = `${proteinPercent}%`;
    document.getElementById('macro-carbs-bar').style.width = `${carbsPercent}%`;
    document.getElementById('macro-fats-bar').style.width = `${fatsPercent}%`;

    renderLogsList(dayData);
    updateProfilePill();
}

// Render the logs list view
function renderLogsList(dayData) {
    logsListContainer.innerHTML = '';
    
    const hasFood = dayData.food && dayData.food.length > 0;
    const hasExercise = dayData.exercise && dayData.exercise.length > 0;

    if (!hasFood && !hasExercise) {
        emptyLogsMsg.classList.remove('hidden');
        logsListContainer.appendChild(emptyLogsMsg);
        return;
    }

    emptyLogsMsg.classList.add('hidden');

    // List Food
    if (hasFood) {
        dayData.food.forEach((item, idx) => {
            const div = document.createElement('div');
            div.className = 'log-item';
            
            // Render macro tags if present
            let macroTag = '';
            if (item.protein !== undefined || item.fat !== undefined || item.carbs !== undefined) {
                const p = item.protein !== undefined ? item.protein : 0;
                const f = item.fat !== undefined ? item.fat : 0;
                const c = item.carbs !== undefined ? item.carbs : 0;
                macroTag = ` | P: ${p}g • F: ${f}g • C: ${c}g`;
            }
            
            const servingsText = item.servings && parseFloat(item.servings) !== 1 ? ` (x${item.servings})` : '';
            div.innerHTML = `
                <div class="log-item-details">
                    <span class="log-item-bullet food"></span>
                    <div class="log-item-text">
                        <span class="log-item-name">${item.name}${servingsText}</span>
                        <span class="log-item-meta">${item.meal} • Food${macroTag}</span>
                    </div>
                </div>
                <div class="log-item-right">
                    <span class="log-item-value">+${item.calories} kcal</span>
                    <button class="btn-delete-log" onclick="deleteItem('food', ${idx})">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            `;
            logsListContainer.appendChild(div);
        });
    }

    // List Exercise
    if (hasExercise) {
        dayData.exercise.forEach((item, idx) => {
            const div = document.createElement('div');
            div.className = 'log-item';
            div.innerHTML = `
                <div class="log-item-details">
                    <span class="log-item-bullet exercise"></span>
                    <div class="log-item-text">
                        <span class="log-item-name">${item.name}</span>
                        <span class="log-item-meta">${item.duration} mins • Workout</span>
                    </div>
                </div>
                <div class="log-item-right">
                    <span class="log-item-value" style="color: var(--accent-orange)">-${item.calories} kcal</span>
                    <button class="btn-delete-log" onclick="deleteItem('exercise', ${idx})">
                        <i data-lucide="trash-2"></i>
                    </button>
                </div>
            `;
            logsListContainer.appendChild(div);
        });
    }
    
    // Re-create icons for new items
    lucide.createIcons();
}

function updateProfilePill() {
    const weight = userProfile.weight;
    const heightFeet = Math.floor(userProfile.height / 12);
    const heightInches = userProfile.height % 12;
    const bmi = calculateBMI();
    document.querySelector('.profile-name').innerText = `${weight}kg • ${heightFeet}'${heightInches}" • BMI: ${bmi}`;
}

// ---------------------------------------------------------------------
// Interaction Logic
// ---------------------------------------------------------------------

// Delete log entry
window.deleteItem = function(type, index) {
    if (dailyLogs[activeDateStr] && dailyLogs[activeDateStr][type]) {
        dailyLogs[activeDateStr][type].splice(index, 1);
        saveLogs();
        renderDashboard();
        refreshWeeklyIfActive();
        // Recalculate live coach recommendations
        generateCoachRecommendations(true);
    }
};

function saveLogs() {
    localStorage.setItem('chirag_logs', JSON.stringify(dailyLogs));
}

// Tab Switching logic
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        
        btn.classList.add('active');
        document.getElementById(btn.dataset.tab).classList.add('active');
    });
});

// DOM reference for food servings input
const foodServingsInput = document.getElementById('food-servings');
let baseCalories = 0;
let baseMacros = null;

// Suggestions click handler for Foods
document.querySelectorAll('.btn-suggestion').forEach(btn => {
    btn.addEventListener('click', () => {
        const name = btn.dataset.name;
        const cals = parseInt(btn.dataset.cals);
        document.getElementById('food-name').value = name;
        document.getElementById('food-calories').value = cals;
        foodServingsInput.value = 1;
        
        // Find if it exists in VEG_MENU to get true macros, otherwise estimate
        const match = VEG_MENU.find(item => item.name.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(item.name.toLowerCase()));
        if (match) {
            baseCalories = match.calories;
            baseMacros = { protein: match.protein, fat: match.fat, carbs: match.carbs };
        } else {
            baseCalories = cals;
            baseMacros = estimateMacrosFromCals(cals);
        }
        tempMacros = { ...baseMacros };
    });
});

// Autocomplete / Searchable dropdown for Indian Veg Menu
const foodSearchDropdown = document.getElementById('food-search-results');
const foodNameInput = document.getElementById('food-name');
const foodCaloriesInput = document.getElementById('food-calories');
const foodMealSelect = document.getElementById('food-meal');

// Event listener for serving quantity adjustments
foodServingsInput.addEventListener('input', () => {
    const servings = parseFloat(foodServingsInput.value) || 1;
    if (baseCalories > 0) {
        foodCaloriesInput.value = Math.round(baseCalories * servings);
    }
    if (baseMacros) {
        tempMacros = {
            protein: Math.round(baseMacros.protein * servings * 10) / 10,
            fat: Math.round(baseMacros.fat * servings * 10) / 10,
            carbs: Math.round(baseMacros.carbs * servings * 10) / 10
        };
    } else {
        const currentCals = parseFloat(foodCaloriesInput.value) || 0;
        tempMacros = estimateMacrosFromCals(currentCals);
    }
});

// Event listener for direct calorie field adjustments
foodCaloriesInput.addEventListener('input', () => {
    const calories = parseFloat(foodCaloriesInput.value) || 0;
    const servings = parseFloat(foodServingsInput.value) || 1;
    baseCalories = calories / servings;
    baseMacros = estimateMacrosFromCals(baseCalories);
    tempMacros = estimateMacrosFromCals(calories);
});

function showFoodSuggestions(query) {
    if (!query) {
        foodSearchDropdown.classList.add('hidden');
        return;
    }
    
    const filtered = VEG_MENU.filter(item => 
        item.name.toLowerCase().includes(query.toLowerCase())
    );
    
    if (filtered.length === 0) {
        foodSearchDropdown.classList.add('hidden');
        return;
    }
    
    foodSearchDropdown.innerHTML = '';
    filtered.slice(0, 8).forEach(item => {
        const div = document.createElement('div');
        div.className = 'search-item';
        div.innerHTML = `
            <span class="search-item-name">${item.name}</span>
            <span class="search-item-cals">${item.calories} kcal</span>
        `;
        div.addEventListener('mousedown', (e) => {
            e.preventDefault();
            foodNameInput.value = item.name;
            foodCaloriesInput.value = item.calories;
            foodMealSelect.value = item.meal;
            
            // Set servings, base calories and base macros
            foodServingsInput.value = 1;
            baseCalories = item.calories;
            baseMacros = { protein: item.protein, fat: item.fat, carbs: item.carbs };
            tempMacros = { ...baseMacros };
            
            foodSearchDropdown.classList.add('hidden');
        });
        foodSearchDropdown.appendChild(div);
    });
    
    foodSearchDropdown.classList.remove('hidden');
}

foodNameInput.addEventListener('input', (e) => {
    showFoodSuggestions(e.target.value.trim());
});

foodNameInput.addEventListener('focus', (e) => {
    showFoodSuggestions(e.target.value.trim());
});

foodNameInput.addEventListener('blur', () => {
    setTimeout(() => {
        foodSearchDropdown.classList.add('hidden');
    }, 200);
});

// Suggestions click handler for Exercises
document.querySelectorAll('.btn-suggestion-exercise').forEach(btn => {
    btn.addEventListener('click', () => {
        document.getElementById('exercise-name').value = btn.dataset.name;
        document.getElementById('exercise-duration').value = btn.dataset.dur;
        document.getElementById('exercise-calories').value = btn.dataset.cals;
    });
});

// Form Log Food
// Global macros cache
let tempMacros = null;

foodForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('food-name').value;
    const calories = parseInt(document.getElementById('food-calories').value);
    const meal = document.getElementById('food-meal').value;
    const servings = parseFloat(foodServingsInput.value) || 1;
    
    if (!dailyLogs[activeDateStr]) dailyLogs[activeDateStr] = { food: [], exercise: [], water: 0 };
    
    const foodItem = { name, calories, meal, servings };
    if (tempMacros) {
        foodItem.protein = tempMacros.protein;
        foodItem.fat = tempMacros.fat;
        foodItem.carbs = tempMacros.carbs;
    } else {
        const est = estimateMacrosFromCals(calories);
        foodItem.protein = est.protein;
        foodItem.fat = est.fat;
        foodItem.carbs = est.carbs;
    }
    
    dailyLogs[activeDateStr].food.push(foodItem);
    
    saveLogs();
    renderDashboard();
    refreshWeeklyIfActive();
    
    // Reset form and status msg
    const statusMsg = document.getElementById('food-status-msg');
    statusMsg.classList.add('hidden');
    statusMsg.innerText = '';
    
    foodForm.reset();
    foodServingsInput.value = 1;
    baseCalories = 0;
    baseMacros = null;
    tempMacros = null;
    generateCoachRecommendations(true); // Auto-update recommendations after food log
});

// Internet Nutrition Search Engine
const btnSearchNutrition = document.getElementById('btn-search-nutrition');
const foodStatusMsg = document.getElementById('food-status-msg');

async function searchInternetNutrition() {
    const query = foodNameInput.value.trim();
    if (!query) {
        showStatusMsg("Please type a food name first.", "error");
        return;
    }
    
    showStatusMsg("🔍 Searching internet...", "info");
    tempMacros = null; 
    
    const apiKey = userProfile.apiKey;
    
    if (apiKey) {
        try {
            // Route through corsproxy.io to bypass browser CORS checks on CalorieNinjas
            const targetUrl = `https://api.calorieninjas.com/v1/nutrition?query=${encodeURIComponent(query)}`;
            const url = `https://corsproxy.io/?url=` + encodeURIComponent(targetUrl) + `&reqHeaders=` + encodeURIComponent(`X-Api-Key:${apiKey}`);
            
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`API returned status ${response.status}`);
            }
            
            const data = await response.json();
            if (data.items && data.items.length > 0) {
                const item = data.items[0];
                const calories = Math.round(item.calories);
                const protein = Math.round(item.protein_g * 10) / 10;
                const fat = Math.round(item.fat_total_g * 10) / 10;
                const carbs = Math.round(item.carbohydrates_total_g * 10) / 10;
                
                foodCaloriesInput.value = calories;
                foodServingsInput.value = 1;
                baseCalories = calories;
                baseMacros = { protein, fat, carbs };
                tempMacros = { protein, fat, carbs };
                
                showStatusMsg(`✅ Found! Calories: ${calories} kcal (P: ${protein}g, F: ${fat}g, C: ${carbs}g)`, "success");
                return;
            } else {
                showStatusMsg("Not found on CalorieNinjas. Trying public fallback...", "info");
            }
        } catch (err) {
            console.error("CalorieNinjas lookup failed:", err);
            showStatusMsg("CalorieNinjas error. Trying Open Food Facts database...", "info");
        }
    }
    
    // Option B: Public fallback to Open Food Facts (No custom headers to avoid preflight CORS)
    try {
        const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Public API returned status ${response.status}`);
        }
        
        const data = await response.json();
        if (data.products && data.products.length > 0) {
            const product = data.products[0];
            const calories = Math.round(
                product.nutriments['energy-kcal_value'] || 
                product.nutriments['energy-kcal'] || 
                product.nutriments['energy-kcal_100g'] || 
                (product.nutriments['energy_value'] / 4.184) || 
                200
            );
            const protein = Math.round((product.nutriments.proteins_value || product.nutriments.proteins_100g || 0) * 10) / 10;
            const fat = Math.round((product.nutriments.fat_value || product.nutriments.fat_100g || 0) * 10) / 10;
            const carbs = Math.round((product.nutriments.carbohydrates_value || product.nutriments.carbohydrates_100g || 0) * 10) / 10;
            
            foodCaloriesInput.value = calories;
            foodServingsInput.value = 1;
            baseCalories = calories;
            baseMacros = { protein, fat, carbs };
            tempMacros = { protein, fat, carbs };
            
            showStatusMsg(`✅ Estimated (100g/pack): ${calories} kcal (P: ${protein}g, F: ${fat}g, C: ${carbs}g)`, "success");
        } else {
            showStatusMsg("❌ Food not found on internet. Please enter calories manually.", "error");
        }
    } catch (err) {
        console.error("Open Food Facts search failed:", err);
        showStatusMsg("❌ Error connecting to internet. Enter calories manually.", "error");
    }
}

function showStatusMsg(text, type) {
    foodStatusMsg.innerHTML = text;
    foodStatusMsg.className = "input-status-msg";
    if (type === "error") {
        foodStatusMsg.classList.add("error");
    } else if (type === "success") {
        foodStatusMsg.style.color = "var(--accent-emerald)";
    } else {
        foodStatusMsg.style.color = "var(--accent-cyan)";
    }
    foodStatusMsg.classList.remove('hidden');
}

btnSearchNutrition.addEventListener('click', searchInternetNutrition);

// Auto-trigger search on input blur if calorie field is empty
foodNameInput.addEventListener('blur', () => {
    setTimeout(() => {
        const query = foodNameInput.value.trim();
        const cals = foodCaloriesInput.value.trim();
        if (query && !cals && foodSearchDropdown.classList.contains('hidden')) {
            searchInternetNutrition();
        }
    }, 400); // 400ms delay to ensure autocompletion selects first
});

// Form Log Exercise
const exerciseStatusMsg = document.getElementById('exercise-status-msg');
const btnSearchExercise = document.getElementById('btn-search-exercise');
const exerciseNameInput = document.getElementById('exercise-name');
const exerciseDurationInput = document.getElementById('exercise-duration');
const exerciseCaloriesInput = document.getElementById('exercise-calories');

exerciseForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = exerciseNameInput.value;
    const duration = parseInt(exerciseDurationInput.value);
    const calories = parseInt(exerciseCaloriesInput.value);

    if (!dailyLogs[activeDateStr]) dailyLogs[activeDateStr] = { food: [], exercise: [], water: 0 };
    dailyLogs[activeDateStr].exercise.push({ name, duration, calories });

    saveLogs();
    renderDashboard();
    refreshWeeklyIfActive();

    // Reset form and status msg
    exerciseStatusMsg.classList.add('hidden');
    exerciseStatusMsg.innerText = '';
    exerciseForm.reset();
    generateCoachRecommendations(true); // Auto-update after workout log
});

// Local database of MET (Metabolic Equivalent of Task) values for keyless offline estimation
const MET_DATABASE = {
    "walking": 3.5,
    "walk": 3.5,
    "brisk walking": 4.5,
    "running": 8.0,
    "run": 8.0,
    "jogging": 7.0,
    "jog": 7.0,
    "cycling": 7.5,
    "cycle": 7.5,
    "swimming": 6.0,
    "swim": 6.0,
    "weightlifting": 3.5,
    "weight training": 3.5,
    "gym": 3.5,
    "workout": 4.0,
    "yoga": 2.5,
    "pilates": 3.0,
    "aerobics": 6.5,
    "dancing": 4.5,
    "dance": 4.5,
    "tennis": 7.0,
    "badminton": 5.5,
    "football": 8.0,
    "cricket": 5.0,
    "squash": 12.0
};

function estimateExerciseCalories(activity, durationMin, weightKg) {
    const actLower = activity.toLowerCase().trim();
    let met = 4.0; // default MET for generic activity
    for (const key in MET_DATABASE) {
        if (actLower.includes(key)) {
            met = MET_DATABASE[key];
            break;
        }
    }
    // Formula: MET * Weight (kg) * (Duration / 60)
    return Math.round(met * weightKg * (durationMin / 60));
}

async function searchInternetExercise() {
    const query = exerciseNameInput.value.trim();
    const duration = parseInt(exerciseDurationInput.value) || 30; // default to 30 mins
    if (!query) {
        showExerciseStatusMsg("Please type an activity first.", "error");
        return;
    }
    
    showExerciseStatusMsg("🔍 Searching...", "info");
    
    const apiKey = userProfile.apiKey;
    const weightKg = parseFloat(userProfile.weight) || 90;
    const weightLbs = Math.round(weightKg * 2.20462); // Weight parameter must be in lbs for API Ninjas
    
    if (apiKey) {
        try {
            const targetUrl = `https://api.api-ninjas.com/v1/caloriesburned?activity=${encodeURIComponent(query)}&weight=${weightLbs}&duration=${duration}`;
            const url = `https://corsproxy.io/?url=` + encodeURIComponent(targetUrl) + `&reqHeaders=` + encodeURIComponent(`X-Api-Key:${apiKey}`);
            
            const response = await fetch(url);
            
            if (response.ok) {
                const data = await response.json();
                if (data && data.length > 0) {
                    const item = data[0];
                    const calories = Math.round(item.total_calories);
                    
                    // Set outputs
                    exerciseCaloriesInput.value = calories;
                    exerciseDurationInput.value = duration;
                    
                    showExerciseStatusMsg(`✅ Found! Est. Calories: ${calories} kcal for ${duration} mins (${item.name})`, "success");
                    return;
                }
            }
        } catch (err) {
            console.warn("Exercise API lookup failed, falling back to local MET calculations:", err);
        }
    }
    
    // Keyless or failed key fallback: Local MET-based estimation
    const calories = estimateExerciseCalories(query, duration, weightKg);
    exerciseCaloriesInput.value = calories;
    exerciseDurationInput.value = duration;
    
    showExerciseStatusMsg(`✅ Estimated (Local MET Model): ${calories} kcal for ${duration} mins`, "success");
}

function showExerciseStatusMsg(text, type) {
    exerciseStatusMsg.innerHTML = text;
    exerciseStatusMsg.className = "input-status-msg";
    if (type === "error") {
        exerciseStatusMsg.classList.add("error");
    } else if (type === "success") {
        exerciseStatusMsg.style.color = "var(--accent-emerald)";
    } else {
        exerciseStatusMsg.style.color = "var(--accent-cyan)";
    }
    exerciseStatusMsg.classList.remove('hidden');
}

btnSearchExercise.addEventListener('click', searchInternetExercise);

// Auto-trigger search on name/duration focus out if calories is empty
exerciseNameInput.addEventListener('blur', () => {
    setTimeout(() => {
        const query = exerciseNameInput.value.trim();
        const cals = exerciseCaloriesInput.value.trim();
        if (query && !cals) {
            searchInternetExercise();
        }
    }, 400);
});
exerciseDurationInput.addEventListener('blur', () => {
    setTimeout(() => {
        const query = exerciseNameInput.value.trim();
        const cals = exerciseCaloriesInput.value.trim();
        if (query && !cals) {
            searchInternetExercise();
        }
    }, 400);
});

// Add Water clicks
document.querySelectorAll('.btn-water').forEach(btn => {
    if (btn.classList.contains('reset')) return;
    btn.addEventListener('click', () => {
        const amt = parseInt(btn.dataset.amount);
        if (!dailyLogs[activeDateStr]) dailyLogs[activeDateStr] = { food: [], exercise: [], water: 0 };
        dailyLogs[activeDateStr].water = (dailyLogs[activeDateStr].water || 0) + amt;
        
        saveLogs();
        renderDashboard();
        refreshWeeklyIfActive();
        generateCoachRecommendations(true); // Auto-update after water log
    });
});

// Water Reset
waterResetBtn.addEventListener('click', () => {
    if (dailyLogs[activeDateStr]) {
        dailyLogs[activeDateStr].water = 0;
        saveLogs();
        renderDashboard();
        refreshWeeklyIfActive();
        generateCoachRecommendations(true);
    }
});

// Clear Day Journal
clearDayBtn.addEventListener('click', () => {
    if (confirm("Are you sure you want to clear today's food, water, and workouts?")) {
        dailyLogs[activeDateStr] = { food: [], exercise: [], water: 0 };
        saveLogs();
        renderDashboard();
        refreshWeeklyIfActive();
        generateCoachRecommendations(true);
    }
});

// Date navigation
prevDayBtn.addEventListener('click', () => {
    currentDayOffset--;
    updateDateDisplay();
    renderDashboard();
    refreshWeeklyIfActive();
    generateCoachRecommendations(false);
});

nextDayBtn.addEventListener('click', () => {
    currentDayOffset++;
    updateDateDisplay();
    renderDashboard();
    refreshWeeklyIfActive();
    generateCoachRecommendations(false);
});

// Key Visibility Helper
function updateAIKeyVisibility() {
    if (!profAiProvider) return;
    const val = profAiProvider.value;
    geminiKeyGroup.classList.add('hidden');
    groqKeyGroup.classList.add('hidden');
    openrouterKeyGroup.classList.add('hidden');
    
    if (val === 'gemini') geminiKeyGroup.classList.remove('hidden');
    if (val === 'groq') groqKeyGroup.classList.remove('hidden');
    if (val === 'openrouter') openrouterKeyGroup.classList.remove('hidden');
}
if (profAiProvider) {
    profAiProvider.addEventListener('change', updateAIKeyVisibility);
}

// Live macro preview — updates as user types in goal fields
function updateGoalPreview() {
    const lossEl = document.getElementById('prof-target-loss');
    const tlEl   = document.getElementById('prof-goal-timeline');
    const wEl    = document.getElementById('prof-weight');
    const hEl    = document.getElementById('prof-height');
    const aEl    = document.getElementById('prof-age');
    const sEl    = document.getElementById('prof-sex');
    const actEl  = document.getElementById('prof-activity');
    if (!lossEl || !tlEl) return;

    const loss     = parseFloat(lossEl.value) || 0;
    const months   = parseInt(tlEl.value)     || 3;
    // Use form values if available, else fall back to saved profile
    const wKg   = parseFloat(wEl ? wEl.value   : userProfile.weight)  || parseFloat(userProfile.weight);
    const hIn   = parseFloat(hEl ? hEl.value   : userProfile.height)  || parseFloat(userProfile.height);
    const age   = parseInt(aEl  ? aEl.value    : userProfile.age)     || parseInt(userProfile.age);
    const sex   = sEl ? sEl.value : userProfile.sex;
    const act   = parseFloat(actEl ? actEl.value : userProfile.activityLevel) || 1.2;

    // Mifflin-St Jeor BMR → TDEE
    const hCm  = hIn * 2.54;
    let bmr = (10 * wKg) + (6.25 * hCm) - (5 * age) + (sex === 'male' ? 5 : -161);
    const tdee = Math.round(bmr * act);

    const headlineEl  = document.getElementById('macro-preview-headline');
    const noteEl      = document.getElementById('macro-preview-note');
    const pEl  = document.getElementById('preview-protein');
    const cEl  = document.getElementById('preview-carbs');
    const fEl  = document.getElementById('preview-fats');
    const kcEl = document.getElementById('preview-calories');

    if (loss <= 0) {
        // No goal → show maintenance macros (BMI-based)
        const bmi  = Math.round((wKg / Math.pow(hCm / 100, 2)) * 10) / 10;
        const split = bmi < 18.5 ? {p:20,c:50,f:30} :
                      bmi < 25   ? {p:22,c:50,f:28} :
                      bmi < 30   ? {p:25,c:45,f:30} :
                                   {p:30,c:40,f:30};
        if (headlineEl) headlineEl.textContent = 'Maintenance — no weight loss goal set';
        if (pEl)  pEl.textContent  = Math.round(tdee * split.p / 100 / 4);
        if (cEl)  cEl.textContent  = Math.round(tdee * split.c / 100 / 4);
        if (fEl)  fEl.textContent  = Math.round(tdee * split.f / 100 / 9);
        if (kcEl) kcEl.textContent = tdee;
        if (noteEl) noteEl.textContent = '';
        return;
    }

    const totalDays    = months * 30;
    const required     = Math.round((loss * 7700) / totalDays);
    const safeDeficit  = Math.min(required, 1000);
    const budget       = Math.max(1200, tdee - safeDeficit);
    const capped       = required > 1000;

    // Weight-loss optimised macro split: 35P / 35C / 30F
    const proteinG = Math.round(budget * 0.35 / 4);
    const carbsG   = Math.round(budget * 0.35 / 4);
    const fatG     = Math.round(budget * 0.30 / 9);

    if (headlineEl) headlineEl.textContent = 'Lose ' + loss + ' kg in ' + months + ' months — daily targets:';
    if (pEl)  pEl.textContent  = proteinG;
    if (cEl)  cEl.textContent  = carbsG;
    if (fEl)  fEl.textContent  = fatG;
    if (kcEl) kcEl.textContent = budget;
    if (noteEl) {
        noteEl.innerHTML = '\u2212' + safeDeficit + ' kcal/day deficit from your TDEE (' + tdee + ' kcal)' +
            (capped ? ' &nbsp;<strong style="color:#fbbf24">\u26a0\ufe0f Capped at 1000 for safety</strong>' : '');
    }
}

// Profile Modal triggers
profilePillTrigger.addEventListener('click', () => {
    document.getElementById('prof-weight').value   = userProfile.weight;
    document.getElementById('prof-height').value   = userProfile.height;
    document.getElementById('prof-age').value      = userProfile.age;
    document.getElementById('prof-sex').value      = userProfile.sex;
    document.getElementById('prof-activity').value = userProfile.activityLevel;
    document.getElementById('prof-api-key').value  = userProfile.apiKey || '';

    // Populate goal fields
    const tg = userProfile.transformGoal || {};
    const tlEl = document.getElementById('prof-target-loss');
    const tmEl = document.getElementById('prof-goal-timeline');
    if (tlEl) tlEl.value = tg.targetLoss   || 0;
    if (tmEl) tmEl.value = tg.timelineMonths || 3;

    if (profAiProvider) profAiProvider.value = userProfile.aiProvider || 'gemini';
    document.getElementById('prof-gemini-key').value = userProfile.geminiApiKey || '';
    const profGroqKeyInput = document.getElementById('prof-groq-key');
    if (profGroqKeyInput) profGroqKeyInput.value = userProfile.groqApiKey || '';
    const profOpenRouterKeyInput = document.getElementById('prof-openrouter-key');
    if (profOpenRouterKeyInput) profOpenRouterKeyInput.value = userProfile.openrouterApiKey || '';

    updateAIKeyVisibility();
    updateGoalPreview();
    profileModal.classList.add('active');
});

closeProfileModalBtn.addEventListener('click', () => {
    profileModal.classList.remove('active');
});

// Close modal on click overlay
profileModal.addEventListener('click', (e) => {
    if (e.target === profileModal) {
        profileModal.classList.remove('remove');
        profileModal.classList.remove('active');
    }
});

// Reset all data handler
const resetAllDataBtn = document.getElementById('reset-all-data-btn');
if (resetAllDataBtn) {
    resetAllDataBtn.addEventListener('click', () => {
        if (confirm("Are you sure you want to delete all historical logs, reset settings, and start fresh? This cannot be undone.")) {
            localStorage.removeItem('chirag_logs');
            localStorage.setItem('chirag_seeded', 'true');
            dailyLogs = {};
            currentDayOffset = 0;
            updateDateDisplay();
            renderDashboard();
            if (!weeklyViewContainer.classList.contains('hidden')) {
                renderWeeklyDashboard();
            }
            generateCoachRecommendations(true);
            profileModal.classList.remove('active');
            alert("All app data has been reset successfully.");
        }
    });
}

// Live update macro preview as user types in any profile field
['prof-target-loss', 'prof-goal-timeline', 'prof-weight', 'prof-height', 'prof-age', 'prof-sex', 'prof-activity'].forEach(function(id) {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updateGoalPreview);
    if (el) el.addEventListener('change', updateGoalPreview);
});

profileForm.addEventListener('submit', (e) => {
    e.preventDefault();
    userProfile.weight        = parseFloat(document.getElementById('prof-weight').value);
    userProfile.height        = parseFloat(document.getElementById('prof-height').value);
    userProfile.age           = parseInt(document.getElementById('prof-age').value);
    userProfile.sex           = document.getElementById('prof-sex').value;
    userProfile.activityLevel = parseFloat(document.getElementById('prof-activity').value);
    userProfile.apiKey        = document.getElementById('prof-api-key').value.trim();

    if (profAiProvider) userProfile.aiProvider = profAiProvider.value;
    userProfile.geminiApiKey = document.getElementById('prof-gemini-key').value.trim();
    const profGroqKeyInput = document.getElementById('prof-groq-key');
    if (profGroqKeyInput) userProfile.groqApiKey = profGroqKeyInput.value.trim();
    const profOpenRouterKeyInput = document.getElementById('prof-openrouter-key');
    if (profOpenRouterKeyInput) userProfile.openrouterApiKey = profOpenRouterKeyInput.value.trim();

    // Always save goal from the visible fields
    const targetLoss     = parseFloat(document.getElementById('prof-target-loss').value)  || 0;
    const timelineMonths = parseInt(document.getElementById('prof-goal-timeline').value)   || 3;

    if (targetLoss > 0) {
        const totalDays      = timelineMonths * 30;
        const requiredDeficit = Math.round((targetLoss * 7700) / totalDays);
        const safeDeficit    = Math.min(requiredDeficit, 1000);
        const prevTg         = userProfile.transformGoal || {};
        // Preserve start date/weight only if same goal, otherwise reset
        const sameGoal = prevTg.active && prevTg.targetLoss === targetLoss && prevTg.timelineMonths === timelineMonths;
        userProfile.goalType = 'goal';
        userProfile.transformGoal = {
            active:         true,
            targetLoss:     targetLoss,
            timelineMonths: timelineMonths,
            startDate:      sameGoal ? prevTg.startDate   : getLocalDateString(),
            startWeight:    sameGoal ? prevTg.startWeight  : parseFloat(userProfile.weight),
            dailyDeficit:   safeDeficit
        };
    } else {
        // No weight loss target → maintenance
        userProfile.goalType = 'maintenance';
        if (userProfile.transformGoal) userProfile.transformGoal.active = false;
    }

    localStorage.setItem('chirag_profile', JSON.stringify(userProfile));
    profileModal.classList.remove('active');
    renderDashboard();
    generateCoachRecommendations(true);
});



let cachedWorkingModelConfig = JSON.parse(localStorage.getItem('chirag_working_model_config')) || null;

// Helper to call Google Gemini API with fallback from stable v1 to v1beta endpoints, scanning model options
async function fetchGeminiContent(apiKey, prompt, base64Image = null, mimeType = 'image/jpeg') {
    const parts = [{ text: prompt }];
    if (base64Image) {
        parts.push({
            inlineData: {
                mimeType: mimeType,
                data: base64Image
            }
        });
    }

    const payload = {
        contents: [{ parts: parts }]
    };

    // Try cached config first
    if (cachedWorkingModelConfig) {
        try {
            const url = `https://generativelanguage.googleapis.com/${cachedWorkingModelConfig.version}/models/${cachedWorkingModelConfig.model}:generateContent?key=${apiKey}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (response.ok) {
                const data = await response.json();
                if (data.candidates && data.candidates.length > 0 && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts.length > 0) {
                    return data.candidates[0].content.parts[0].text;
                }
            }
        } catch (e) {
            console.warn("Cached Gemini model config failed, re-discovering...", e);
            cachedWorkingModelConfig = null;
            localStorage.removeItem('chirag_working_model_config');
        }
    }

    const models = [
        'gemini-1.5-flash',
        'gemini-1.5-flash-latest',
        'gemini-2.0-flash',
        'gemini-2.0-flash-exp',
        'gemini-1.5-pro',
        'gemini-pro'
    ];

    const apiVersions = ['v1', 'v1beta'];
    let lastError = null;

    for (const version of apiVersions) {
        for (const model of models) {
            try {
                const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${apiKey}`;
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.candidates && data.candidates.length > 0 && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts.length > 0) {
                        // Cache the successful configuration
                        cachedWorkingModelConfig = { version, model };
                        localStorage.setItem('chirag_working_model_config', JSON.stringify(cachedWorkingModelConfig));
                        console.log(`Successfully discovered and cached model ${model} on endpoint ${version}`);
                        return data.candidates[0].content.parts[0].text;
                    }
                } else {
                    const errText = await response.text();
                    let errObj = {};
                    try { errObj = JSON.parse(errText); } catch(e) {}
                    
                    const errMsg = (errObj.error && errObj.error.message) || errText;
                    const errStatus = response.status;
                    
                    const newErr = new Error(`API returned status ${errStatus}: ${errMsg}`);
                    
                    // Prefer storing 403 or 429 errors over 404/400 errors as they are more descriptive of auth/quota issues
                    if (!lastError || errStatus === 429 || errStatus === 403) {
                        lastError = newErr;
                    }
                    console.warn(`Model ${model} on ${version} returned status ${errStatus}, trying next model fallback...`);
                }
            } catch (e) {
                if (!lastError) {
                    lastError = e;
                }
                console.warn(`Fetch error for model ${model} on ${version}:`, e);
            }
        }
    }

    throw lastError || new Error("No supported Gemini models found.");
}

// Helper to call Groq API with Llama 3 models
async function fetchGroqContent(apiKey, prompt, base64Image = null, mimeType = 'image/jpeg') {
    const model = base64Image ? 'llama-3.2-11b-vision-preview' : 'llama-3.3-70b-versatile';
    const messages = [];
    if (base64Image) {
        messages.push({
            role: "user",
            content: [
                { type: "text", text: prompt },
                {
                    type: "image_url",
                    image_url: {
                        url: `data:${mimeType};base64,${base64Image}`
                    }
                }
            ]
        });
    } else {
        messages.push({
            role: "user",
            content: prompt
        });
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: model,
            messages: messages,
            temperature: 0.3
        })
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Groq API returned status ${response.status}: ${errText}`);
    }

    const data = await response.json();
    if (data.choices && data.choices.length > 0 && data.choices[0].message) {
        return data.choices[0].message.content;
    }
    throw new Error("Invalid response format from Groq.");
}

// Helper to call OpenRouter API with free models
async function fetchOpenRouterContent(apiKey, prompt, base64Image = null, mimeType = 'image/jpeg') {
    const model = base64Image ? 'google/gemini-2.5-flash:free' : 'google/gemini-2.5-flash:free';
    const messages = [];
    if (base64Image) {
        messages.push({
            role: "user",
            content: [
                { type: "text", text: prompt },
                {
                    type: "image_url",
                    image_url: {
                        url: `data:${mimeType};base64,${base64Image}`
                    }
                }
            ]
        });
    } else {
        messages.push({
            role: "user",
            content: prompt
        });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`,
            "HTTP-Referer": window.location.origin,
            "X-Title": "Chirag's Fitness Coach"
        },
        body: JSON.stringify({
            model: model,
            messages: messages,
            temperature: 0.3
        })
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`OpenRouter API returned status ${response.status}: ${errText}`);
    }

    const data = await response.json();
    if (data.choices && data.choices.length > 0 && data.choices[0].message) {
        return data.choices[0].message.content;
    }
    throw new Error("Invalid response format from OpenRouter.");
}

// Check if user has active API key for selected provider
function hasActiveAIKey() {
    const provider = userProfile.aiProvider || 'gemini';
    if (provider === 'gemini') return !!userProfile.geminiApiKey;
    if (provider === 'groq') return !!userProfile.groqApiKey;
    if (provider === 'openrouter') return !!userProfile.openrouterApiKey;
    return false;
}

// Generalized dispatcher to call whichever AI provider is configured
async function fetchAIContent(prompt, base64Image = null, mimeType = 'image/jpeg') {
    const provider = userProfile.aiProvider || 'gemini';
    if (provider === 'gemini') {
        const apiKey = userProfile.geminiApiKey;
        if (!apiKey) throw new Error("🔑 Gemini API Key missing. Please add it in settings.");
        return await fetchGeminiContent(apiKey, prompt, base64Image, mimeType);
    } else if (provider === 'groq') {
        const apiKey = userProfile.groqApiKey;
        if (!apiKey) throw new Error("🔑 Groq API Key missing. Please add it in settings.");
        return await fetchGroqContent(apiKey, prompt, base64Image, mimeType);
    } else if (provider === 'openrouter') {
        const apiKey = userProfile.openrouterApiKey;
        if (!apiKey) throw new Error("🔑 OpenRouter API Key missing. Please add it in settings.");
        return await fetchOpenRouterContent(apiKey, prompt, base64Image, mimeType);
    }
    throw new Error("Unsupported AI Provider selected.");
}

// ---------------------------------------------------------------------
// Rule-Based Coach Intelligence Engine
// ---------------------------------------------------------------------
async function generateCoachRecommendations(userInitiated = true) {
    const dayData = dailyLogs[activeDateStr] || { food: [], exercise: [], water: 0 };
    const totalConsumed = dayData.food.reduce((sum, item) => sum + parseInt(item.calories || 0), 0);
    const totalBurned   = dayData.exercise.reduce((sum, item) => sum + parseInt(item.calories || 0), 0);
    const totalWater    = dayData.water || 0;
    const budget        = getCalorieBudget();
    const netCalories   = totalConsumed - totalBurned;

    // Collect macros — handle both .fat and .fats field names
    let totalProtein = 0, totalCarbs = 0, totalFats = 0;
    dayData.food.forEach(item => {
        totalProtein += parseFloat(item.protein || 0);
        totalCarbs   += parseFloat(item.carbs   || 0);
        totalFats    += parseFloat(item.fat || item.fats || 0);
    });
    totalProtein = Math.round(totalProtein * 10) / 10;
    totalCarbs   = Math.round(totalCarbs   * 10) / 10;
    totalFats    = Math.round(totalFats    * 10) / 10;

    // Use the same goal-aligned macro targets as the dashboard
    const bmi    = calculateBMI();
    const splits = getMacroSplitPercentages(bmi);
    const proteinTargetG = Math.round(budget * splits.protein / 100 / 4);
    const carbsTargetG   = Math.round(budget * splits.carbs   / 100 / 4);
    const fatsTargetG    = Math.round(budget * splits.fat     / 100 / 9);

    // ── AI coach (if key available) ──────────────────────────────────────
    if (userInitiated && hasActiveAIKey()) {
        recommendationsContainer.innerHTML = `
            <div class="recommendation-item" style="width:100%;">
                <i class="tip-icon info">⏳</i>
                <p><strong>AI Coach is analysing your day…</strong></p>
            </div>`;

        if (!document.getElementById('spin-style')) {
            const s = document.createElement('style');
            s.id = 'spin-style';
            s.innerHTML = `@keyframes spin { 100% { transform: rotate(360deg); } }`;
            document.head.appendChild(s);
        }

        try {
            const foodList    = dayData.food.length
                ? dayData.food.map(f => `${f.name} (${f.calories} kcal, P:${parseFloat(f.protein||0)}g, C:${parseFloat(f.carbs||0)}g, F:${parseFloat(f.fat||f.fats||0)}g)`).join('; ')
                : 'Nothing logged yet';
            const workoutList = dayData.exercise.length
                ? dayData.exercise.map(e => `${e.name} – ${e.duration} min, ${e.calories} kcal burned`).join('; ')
                : 'No workout logged';

            const tg = userProfile.transformGoal;
            const goalLine = tg && tg.active
                ? `Weight-loss goal: lose ${tg.targetLoss} kg in ${tg.timelineMonths} months (−${tg.dailyDeficit} kcal/day deficit).`
                : 'Goal: weight maintenance.';

            const prompt =
                `You are a premium fitness coach for "Chirag's Fitness Coach" app.\n` +
                `User: ${userProfile.sex}, age ${userProfile.age}, weight ${userProfile.weight} kg, height ${userProfile.height} in, vegetarian.\n` +
                `${goalLine}\n` +
                `Daily calorie budget: ${budget} kcal. Macro targets: Protein ${proteinTargetG}g / Carbs ${carbsTargetG}g / Fat ${fatsTargetG}g.\n\n` +
                `TODAY'S DATA:\n` +
                `• Consumed: ${totalConsumed} kcal | Burned: ${totalBurned} kcal | Net: ${netCalories} kcal\n` +
                `• Macros eaten: Protein ${totalProtein}g / Carbs ${totalCarbs}g / Fat ${totalFats}g\n` +
                `• Water: ${totalWater} ml (target 2500 ml)\n` +
                `• Foods: ${foodList}\n` +
                `• Workouts: ${workoutList}\n\n` +
                `Write a coaching review in clean HTML (no markdown fences). Include:\n` +
                `1. One-sentence overall assessment of today.\n` +
                `2. Exactly 3 specific, actionable bullet points (<li>) referencing the actual foods/workouts logged.\n` +
                `Keep it under 120 words. Use <strong> for key numbers. Be encouraging but honest.`;

            const aiText = await fetchAIContent(prompt);
            recommendationsContainer.innerHTML = `
                <div class="recommendation-item ai-response-card" style="border-left-color:var(--accent-emerald);width:100%;">
                    <i data-lucide="sparkles" class="tip-icon success"></i>
                    <div style="font-size:0.88rem;line-height:1.6;">${aiText}</div>
                </div>`;
            lucide.createIcons();
            return;
        } catch (err) {
            console.warn('AI coach failed, using rules:', err.message);
            // fall through to rule engine
        }
    }

    // ── Rule-based coach — fully aware of every food you logged today ─────
    const recommendations = [];

    // Classify each logged food by its protein density
    const LOW_PROTEIN_THRESHOLD = 5; // g per item
    const HIGH_PROTEIN_THRESHOLD = 10; // g per item
    const lowProteinFoods  = dayData.food.filter(f => parseFloat(f.protein || 0) < LOW_PROTEIN_THRESHOLD);
    const highProteinFoods = dayData.food.filter(f => parseFloat(f.protein || 0) >= HIGH_PROTEIN_THRESHOLD);
    const proteinGap = Math.round(proteinTargetG - totalProtein);
    const caloriesRemaining = Math.max(0, budget - netCalories);

    // Smart next-meal protein suggestions based on how much is still needed
    function proteinSuggestion(gapG) {
        if (gapG > 30) return 'add a full meal with paneer, tofu, or soya chunks';
        if (gapG > 15) return 'add a side of paneer bhurji, Greek yogurt, or a dal bowl';
        return 'add a small serving of paneer, sprouts, or a boiled egg-equivalent like tofu';
    }

    // Nothing at all logged
    if (totalConsumed === 0 && totalBurned === 0 && totalWater === 0) {
        recommendations.push({ icon: 'info', type: 'info',
            text: `<strong>Start Logging!</strong> Add your first meal, water or workout above — your personalised coaching tips will appear here instantly.` });
        renderRecs(recommendations);
        return;
    }

    // ── 1. Calorie budget ────────────────────────────────────────────────
    if (totalConsumed === 0) {
        recommendations.push({ icon: 'info', type: 'info',
            text: `<strong>No food logged yet.</strong> Your daily budget is <strong>${budget} kcal</strong>. Log your first meal to start tracking.` });
    } else if (netCalories > budget) {
        const over    = Math.round(netCalories - budget);
        const topItem = [...dayData.food].sort((a, b) => b.calories - a.calories)[0];
        recommendations.push({ icon: 'alert-circle', type: 'warning',
            text: `<strong>Over budget by ${over} kcal.</strong> You've consumed <strong>${totalConsumed} kcal</strong> and burned <strong>${totalBurned} kcal</strong> (net ${netCalories} kcal vs ${budget} kcal goal). <strong>${topItem.name}</strong> was your heaviest item at ${topItem.calories} kcal. Consider a 20–30 min walk to offset.` });
    } else {
        const pct = Math.round((netCalories / budget) * 100);
        recommendations.push({ icon: 'check-circle', type: 'success',
            text: `<strong>On track — ${pct}% of budget used.</strong> Net: <strong>${netCalories} kcal</strong> with <strong>${caloriesRemaining} kcal still available</strong> for your remaining meals today.` });
    }

    // ── 2. Protein — name the low-protein foods specifically ─────────────
    if (totalConsumed > 0 && totalProtein < proteinTargetG) {
        if (totalProtein < proteinTargetG * 0.5) {
            // Severely low — name the culprits and suggest fix
            const lowNames  = lowProteinFoods.length  ? lowProteinFoods.map(f => f.name).join(', ')  : null;
            const highNames = highProteinFoods.length ? highProteinFoods.map(f => f.name).join(', ') : null;

            let msg = `<strong>Low protein (${totalProtein}g / ${proteinTargetG}g target) — ${proteinGap}g still needed.</strong> `;
            if (lowNames)  msg += `<strong>${lowNames}</strong> ${lowProteinFoods.length === 1 ? 'is' : 'are'} low in protein. `;
            if (highNames) msg += `<strong>${highNames}</strong> helped. `;
            msg += `For your next meal, <strong>${proteinSuggestion(proteinGap)}</strong> to protect muscle and stay full.`;
            recommendations.push({ icon: 'alert-triangle', type: 'warning', text: msg });

        } else {
            // Getting there — progress nudge with names
            const highNames = highProteinFoods.length ? highProteinFoods.map(f => f.name).join(', ') : null;
            let msg = `<strong>Protein progress (${totalProtein}g / ${proteinTargetG}g) — ${proteinGap}g more needed.</strong> `;
            if (highNames) msg += `<strong>${highNames}</strong> contributed well. `;
            msg += `${proteinSuggestion(proteinGap)} to finish strong.`;
            recommendations.push({ icon: 'info', type: 'info', text: msg });
        }
    } else if (totalConsumed > 0 && totalProtein >= proteinTargetG) {
        const highNames = highProteinFoods.map(f => f.name).join(', ');
        recommendations.push({ icon: 'check-circle', type: 'success',
            text: `<strong>Protein goal hit! (${totalProtein}g / ${proteinTargetG}g) ✅</strong>${highNames ? ` <strong>${highNames}</strong> were your best protein sources today.` : ''} This keeps you full and protects muscle on a deficit.` });
    }

    // ── 3. Carb-heavy / low-protein meal pattern warning ─────────────────
    // Detects classic Indian meals: sheera, khichdi, poha, upma, dal rice etc. that are carb-heavy but low protein
    const carbHeavyKeywords = ['sheera', 'halwa', 'khichdi', 'poha', 'upma', 'idli', 'dosa', 'roti', 'rice', 'dal rice', 'rajma rice', 'bread', 'paratha', 'chapati'];
    const carbHeavyMeals = dayData.food.filter(f => {
        const n = f.name.toLowerCase();
        return carbHeavyKeywords.some(k => n.includes(k)) && parseFloat(f.protein || 0) < 8;
    });
    if (carbHeavyMeals.length >= 2 && totalProtein < proteinTargetG * 0.8) {
        const mealNames = carbHeavyMeals.map(f => f.name).join(' + ');
        recommendations.push({ icon: 'alert-triangle', type: 'warning',
            text: `<strong>Carb-heavy pattern detected.</strong> <strong>${mealNames}</strong> are rich in carbs but low in protein. Your protein goal is still <strong>${proteinGap}g short</strong> — for your next meal, pair with <strong>paneer, tofu, Greek yogurt, or soya chunks</strong> to balance your macros.` });
    }

    // ── 4. Water — adjusted for workout intensity ─────────────────────────
    const totalWorkoutMins = dayData.exercise.reduce((s, e) => s + parseInt(e.duration || 0), 0);
    // Add 500ml per workout session (WHO: ~500ml extra per 30 min intense exercise)
    const waterTarget = 2500 + (totalWorkoutMins > 0 ? Math.round(totalWorkoutMins / 30) * 500 : 0);
    const waterLeft = waterTarget - totalWater;
    const glassesLeft = Math.ceil(Math.max(0, waterLeft) / 250);

    if (totalWater === 0) {
        let wtMsg = `<strong>No water logged yet.</strong> Your target today is <strong>${waterTarget} ml</strong>`;
        if (totalWorkoutMins > 0) wtMsg += ` (base 2500 ml + <strong>${waterTarget - 2500} ml extra</strong> for your ${totalWorkoutMins}-min workout)`;
        wtMsg += `. Drink a glass <strong>now, before each meal, and after your workout</strong> — dehydration slows fat metabolism and causes false hunger.`;
        recommendations.push({ icon: 'droplet', type: 'warning', text: wtMsg });
    } else if (totalWater < waterTarget * 0.5) {
        let wtMsg = `<strong>Hydration critical (${totalWater} ml / ${waterTarget} ml).</strong> You need <strong>${waterLeft} ml more</strong> (~${glassesLeft} glasses). `;
        if (totalWorkoutMins > 0) wtMsg += `Your ${totalWorkoutMins}-min workout increased your target by <strong>${waterTarget - 2500} ml</strong>. `;
        wtMsg += `Drink one glass every 30 minutes to recover and keep metabolism running.`;
        recommendations.push({ icon: 'droplet', type: 'warning', text: wtMsg });
    } else if (totalWater < waterTarget) {
        let wtMsg = `<strong>Water: ${totalWater} ml / ${waterTarget} ml.</strong> `;
        if (totalWorkoutMins > 0) wtMsg += `Your workout added <strong>${waterTarget - 2500} ml</strong> to your target. `;
        wtMsg += `Just <strong>${glassesLeft} more glasses</strong> to go — drink one before bed!`;
        recommendations.push({ icon: 'info', type: 'info', text: wtMsg });
    } else {
        recommendations.push({ icon: 'check-circle', type: 'success',
            text: `<strong>Hydration goal crushed (${totalWater} ml / ${waterTarget} ml) 💧!</strong>${totalWorkoutMins > 0 ? ` Including extra for your ${totalWorkoutMins}-min workout.` : ''} Perfect for fat metabolism, digestion, and muscle recovery.` });
    }

    // ── 5. Workout — specific suggestions with calorie burn estimates ─────
    const wt = parseFloat(userProfile.weight) || 80;
    // MET-based calorie estimates for 30 min at user's weight: cal = MET × wt × 0.5
    const workoutSuggestions = [
        { name: 'Brisk Walk',       met: 3.5,  duration: 30, icon: '🚶' },
        { name: 'Cycling (light)',  met: 5.0,  duration: 30, icon: '🚴' },
        { name: 'Yoga / Stretching',met: 2.5,  duration: 30, icon: '🧘' },
        { name: 'Jump Rope',        met: 10.0, duration: 20, icon: '🪂' },
        { name: 'Bodyweight Squats',met: 5.0,  duration: 20, icon: '🏋️' },
        { name: 'Swimming',         met: 7.0,  duration: 30, icon: '🏊' },
        { name: 'Running (slow)',   met: 7.0,  duration: 30, icon: '🏃' },
    ];

    if (totalBurned === 0) {
        // Pick 3 suggestions that fit remaining calorie room or general fitness
        const picks = workoutSuggestions.slice(0, 4);
        const suggList = picks.map(s => {
            const burnEst = Math.round(s.met * wt * (s.duration / 60));
            return `${s.icon} <strong>${s.name}</strong> (${s.duration} min, ~${burnEst} kcal)`;
        }).join(' &nbsp;|&nbsp; ');
        recommendations.push({ icon: 'flame', type: 'warning',
            text: `<strong>No workout logged yet.</strong> Here's what you can do today with estimated calorie burns for your weight (${wt} kg):<br><br>${suggList}<br><br>Even a <strong>30-min brisk walk</strong> burns ~${Math.round(3.5 * wt * 0.5)} kcal — log it in the Workout tab once done!` });
    } else {
        // Analyse what was done and recommend what's still beneficial
        const workoutList = dayData.exercise.map(e => `<strong>${e.name}</strong> (${e.duration} min, ${e.calories} kcal burned)`).join(', ');
        const hasCardio    = dayData.exercise.some(e => ['walk','run','cycle','jog','swim','rope','hiit','zumba','dance'].some(k => e.name.toLowerCase().includes(k)));
        const hasStrength  = dayData.exercise.some(e => ['squat','gym','weight','strength','push','pull','dumbbell','barbell','plank','yoga','pilates'].some(k => e.name.toLowerCase().includes(k)));

        let workoutMsg = `<strong>Active day — ${totalBurned} kcal burned! 🔥</strong> Logged: ${workoutList}. `;

        if (hasCardio && !hasStrength) {
            workoutMsg += `You did cardio — consider adding <strong>10–15 min of bodyweight strength</strong> (squats, push-ups, planks) to preserve muscle on your deficit. Burns an extra ~${Math.round(5 * wt * 0.25)} kcal.`;
        } else if (hasStrength && !hasCardio) {
            workoutMsg += `Great strength session! Add a <strong>20-min brisk walk</strong> (~${Math.round(3.5 * wt * 0.33)} kcal) after meals to boost fat oxidation and hit your full calorie-burn target.`;
        } else if (hasCardio && hasStrength) {
            workoutMsg += `<strong>Excellent — both cardio and strength! 💪</strong> This is the ideal combo for fat loss and muscle retention. Make sure to get <strong>7–8 hours of sleep tonight</strong> for full recovery.`;
        } else {
            workoutMsg += `This expands your effective calorie budget. Keep the momentum going tomorrow!`;
        }
        recommendations.push({ icon: 'check-circle', type: 'success', text: workoutMsg });

        // Bonus: if total burn is low relative to deficit goal, suggest more
        const tg = userProfile.transformGoal;
        if (tg && tg.active && totalBurned < tg.dailyDeficit * 0.3) {
            const gap = Math.round(tg.dailyDeficit * 0.3 - totalBurned);
            const walkMins = Math.round(gap / (3.5 * wt / 60));
            recommendations.push({ icon: 'info', type: 'info',
                text: `<strong>Burn more to hit your deficit goal.</strong> Your goal needs a ~${tg.dailyDeficit} kcal/day deficit. A <strong>${walkMins}-min walk</strong> (~${gap} kcal) would help you get there today.` });
        }
    }


    // ── 6. High-sugar / fried items flagged by name ───────────────────────
    const junkKeywords = ['sheera', 'halwa', 'jalebi', 'gulab jamun', 'kheer', 'ladoo', 'barfi', 'samosa', 'bhatura', 'pakora', 'vada', 'fried', 'cake', 'biscuit', 'cookie', 'chips', 'namkeen', 'pizza', 'burger', 'chocolate', 'ice cream', 'soda', 'cola', 'juice', 'sweet'];
    const flagged = dayData.food.filter(f => junkKeywords.some(w => f.name.toLowerCase().includes(w)));
    if (flagged.length > 0) {
        const names = flagged.map(f => f.name).join(', ');
        const cals  = flagged.reduce((s, f) => s + parseInt(f.calories || 0), 0);
        recommendations.push({ icon: 'alert-triangle', type: 'warning',
            text: `<strong>High-sugar / processed items: ${names}</strong> contributed <strong>${cals} kcal</strong> in refined carbs or sugar. These spike blood sugar and increase cravings — balance with a protein-rich and fibre-heavy next meal.` });
    }

    // ── 7. Positive callout for balanced meal ─────────────────────────────
    if (totalConsumed > 0 && totalProtein >= proteinTargetG * 0.8 && netCalories <= budget && totalWater >= 1500 && flagged.length === 0) {
        recommendations.push({ icon: 'star', type: 'success',
            text: `<strong>Excellent balance today! ⭐</strong> Your meals — <strong>${dayData.food.map(f => f.name).join(', ')}</strong> — are hitting solid protein, calorie, and hydration targets. Keep this up consistently!` });
    }

    renderRecs(recommendations.slice(0, 6));

    function renderRecs(recs) {
        recommendationsContainer.innerHTML = '';
        recs.forEach(rec => {
            const div = document.createElement('div');
            div.className = 'recommendation-item';
            div.innerHTML = `<i data-lucide="${rec.icon}" class="tip-icon ${rec.type}"></i><p>${rec.text}</p>`;
            recommendationsContainer.appendChild(div);
        });
        lucide.createIcons();
        if (userInitiated) {
            const panel = document.querySelector('.recommendations-panel');
            if (panel) panel.scrollIntoView({ behavior: 'smooth' });
        }
    }
}



    // Nothing at all logged
    if (totalConsumed === 0 && totalBurned === 0 && totalWater === 0) {
        recommendations.push({
            icon: 'info', type: 'info',
            text: `<strong>Start Logging!</strong> Add your first meal, water or workout above — your personalised coaching tips will appear here instantly.`
        });
        renderRecs(recommendations);
        return;
    }

    // ── 1. Calorie budget ────────────────────────────────────────────────
    if (totalConsumed === 0) {
        recommendations.push({ icon: 'info', type: 'info',
            text: `<strong>No food logged yet.</strong> Your daily budget is <strong>${budget} kcal</strong>. Log your first meal to start tracking.` });
    } else if (netCalories > budget) {
        const over    = Math.round(netCalories - budget);
        const topItem = [...dayData.food].sort((a, b) => b.calories - a.calories)[0];
        recommendations.push({ icon: 'alert-circle', type: 'warning',
            text: `<strong>Over budget by ${over} kcal.</strong> Net ${netCalories} kcal vs goal ${budget} kcal. Highest item: <strong>${topItem.name} (${topItem.calories} kcal)</strong>. Consider skipping dessert or adding a 20-min walk (~${Math.round(3.5 * parseFloat(userProfile.weight) * 0.35)} kcal).` });
    } else {
        const remaining = budget - netCalories;
        const pct = Math.round((netCalories / budget) * 100);
        recommendations.push({ icon: 'check-circle', type: 'success',
            text: `<strong>On track — ${pct}% of budget used.</strong> Net calories: <strong>${netCalories} kcal</strong> with <strong>${remaining} kcal remaining</strong> for the rest of the day.` });
    }

    // ── 2. Protein gap ───────────────────────────────────────────────────
    const proteinGap = Math.round(proteinTargetG - totalProtein);
    if (totalConsumed > 0 && totalProtein < proteinTargetG * 0.6) {
        const highP = dayData.food.filter(f => parseFloat(f.protein || 0) >= 6).map(f => f.name);
        const hint  = highP.length
            ? `<strong>${highP.join(', ')}</strong> helped, but you still need <strong>${proteinGap}g more</strong>.`
            : `No high-protein foods yet. Add paneer, Greek yogurt, dal, soya chunks, or moong sprouts.`;
        recommendations.push({ icon: 'alert-triangle', type: 'warning',
            text: `<strong>Low protein (${totalProtein}g / ${proteinTargetG}g target):</strong> ${hint} Protein prevents muscle loss on a deficit.` });
    } else if (totalConsumed > 0 && totalProtein >= proteinTargetG) {
        recommendations.push({ icon: 'check-circle', type: 'success',
            text: `<strong>Protein goal hit! (${totalProtein}g / ${proteinTargetG}g):</strong> Great vegetarian protein intake today. This keeps you full and protects muscle.` });
    } else if (totalConsumed > 0) {
        recommendations.push({ icon: 'info', type: 'info',
            text: `<strong>Protein progress (${totalProtein}g / ${proteinTargetG}g):</strong> You need <strong>${proteinGap}g more</strong> before end of day. Great options: paneer, dal, Greek yogurt.` });
    }

    // ── 3. Water ─────────────────────────────────────────────────────────
    const waterLeft = 2500 - totalWater;
    if (totalWater === 0) {
        recommendations.push({ icon: 'droplet', type: 'warning',
            text: `<strong>No water logged yet.</strong> Target is <strong>2500 ml</strong>. Dehydration slows metabolism and triggers false hunger — drink a glass now!` });
    } else if (totalWater < 1500) {
        recommendations.push({ icon: 'droplet', type: 'warning',
            text: `<strong>Hydration low (${totalWater} ml / 2500 ml):</strong> Need <strong>${waterLeft} ml more</strong> (~${Math.ceil(waterLeft / 250)} glasses). Drink water before each meal to reduce overeating.` });
    } else if (totalWater < 2500) {
        recommendations.push({ icon: 'info', type: 'info',
            text: `<strong>Hydration on track (${totalWater} ml / 2500 ml):</strong> Just <strong>${waterLeft} ml more</strong> (~${Math.ceil(waterLeft / 250)} glasses) to hit your goal today.` });
    } else {
        recommendations.push({ icon: 'check-circle', type: 'success',
            text: `<strong>Hydration goal crushed (${totalWater} ml)! 💧</strong> Great for digestion, metabolism, and appetite control.` });
    }

    // ── 4. Workout ───────────────────────────────────────────────────────
    if (totalBurned === 0) {
        recommendations.push({ icon: 'flame', type: 'warning',
            text: `<strong>No workout logged.</strong> Even a <strong>30-min walk</strong> burns ~${Math.round(3.5 * parseFloat(userProfile.weight) * 0.5)} kcal and boosts your effective budget. Log it in the Workout tab!` });
    } else {
        const workouts = dayData.exercise.map(e => `${e.name} (${e.duration} min)`).join(', ');
        recommendations.push({ icon: 'check-circle', type: 'success',
            text: `<strong>Active day — ${totalBurned} kcal burned!</strong> Logged: <strong>${workouts}</strong>. This expands your net calorie room. Excellent work!` });
    }

    // ── 5. High-calorie single food warning ──────────────────────────────
    const bigItems = dayData.food.filter(f => parseInt(f.calories || 0) > budget * 0.35);
    if (bigItems.length > 0) {
        const names = bigItems.map(f => `${f.name} (${f.calories} kcal)`).join(', ');
        recommendations.push({ icon: 'alert-triangle', type: 'warning',
            text: `<strong>Large single-item calories:</strong> <strong>${names}</strong> each use over 35% of your daily budget. Balance these with lighter, fibre-rich meals for the rest of the day.` });
    }

    // ── 6. Junk/oily/fried food flag ─────────────────────────────────────
    const junkWords = ['fried', 'oily', 'samosa', 'bhatura', 'jalebi', 'halwa', 'sheera', 'cake', 'biscuit', 'cookie', 'chips', 'pizza', 'burger', 'sweet', 'dessert', 'chocolate', 'ice cream', 'soda', 'cola'];
    const flagged = dayData.food.filter(f => junkWords.some(w => f.name.toLowerCase().includes(w)));
    if (flagged.length > 0) {
        const names = flagged.map(f => f.name).join(', ');
        const cals  = flagged.reduce((s, f) => s + parseInt(f.calories || 0), 0);
        recommendations.push({ icon: 'alert-triangle', type: 'warning',
            text: `<strong>High sugar / fried items: ${names}</strong> added <strong>${cals} kcal</strong> in refined carbs/fats. Balance with a protein-heavy next meal and extra water to stabilise blood sugar.` });
    }

    renderRecs(recommendations.slice(0, 5));

    function renderRecs(recs) {
        recommendationsContainer.innerHTML = '';
        recs.forEach(rec => {
            const div = document.createElement('div');
            div.className = 'recommendation-item';
            div.innerHTML = `<i data-lucide="${rec.icon}" class="tip-icon ${rec.type}"></i><p>${rec.text}</p>`;
            recommendationsContainer.appendChild(div);
        });
        lucide.createIcons();
        if (userInitiated) {
            const panel = document.querySelector('.recommendations-panel');
            if (panel) panel.scrollIntoView({ behavior: 'smooth' });
        }
    }
}


// ---------------------------------------------------------------------
// Weekly Report Rendering & Analysis
// ---------------------------------------------------------------------
function renderWeeklyDashboard() {
    const weeklyChartWrapper = document.getElementById('weekly-chart-wrapper');
    const today = new Date();
    
    let totalCons = 0;
    let totalBurn = 0;
    let totalWat = 0;
    let activeDaysCount = 0;
    let goalMetDays = 0;
    let sweetsDays = 0;
    let highWaterDays = 0;

    const daysData = [];
    const budget = getCalorieBudget();

    // Loop through past 7 days (6 days ago to today)
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dateStr = getLocalDateString(d);
        
        const dayLogs = dailyLogs[dateStr] || { food: [], exercise: [], water: 0 };
        
        const consumed = dayLogs.food.reduce((sum, item) => sum + parseInt(item.calories || 0), 0);
        const burned = dayLogs.exercise.reduce((sum, item) => sum + parseInt(item.calories || 0), 0);
        const net = consumed - burned;
        const water = dayLogs.water || 0;
        
        totalCons += consumed;
        totalBurn += burned;
        totalWat += water;
        
        if (burned > 0) activeDaysCount++;
        if (net <= budget) goalMetDays++;
        if (water >= 2500) highWaterDays++;
        
        const sweetsFound = dayLogs.food.some(item => {
            const name = item.name.toLowerCase();
            return name.includes('sheera') || name.includes('halwa') || name.includes('sweet') || name.includes('sugar') || name.includes('cake') || name.includes('dessert') || name.includes('jalebi') || name.includes('samosa');
        });
        if (sweetsFound) sweetsDays++;

        // Short weekday name (e.g. "Mon")
        const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
        
        daysData.push({
            dayLabel: weekday,
            consumed,
            burned,
            budget,
            net
        });
    }

    // Update averages
    const avgConsumed = Math.round(totalCons / 7);
    const avgBurned = Math.round(totalBurn / 7);
    const avgWater = Math.round(totalWat / 7);

    document.getElementById('w-avg-consumed').innerHTML = `${avgConsumed} <span class="w-stat-unit">kcal</span>`;
    document.getElementById('w-avg-burned').innerHTML = `${avgBurned} <span class="w-stat-unit">kcal</span>`;
    document.getElementById('w-avg-water').innerHTML = `${avgWater} <span class="w-stat-unit">ml</span>`;
    document.getElementById('w-active-days').innerHTML = `${activeDaysCount} <span class="w-stat-unit">/ 7</span>`;

    // Clear and re-render chart bars
    weeklyChartWrapper.innerHTML = '';

    // Find maximum value to scale heights (baseline 2000 kcal)
    let maxVal = 2000;
    daysData.forEach(d => {
        if (d.consumed > maxVal) maxVal = d.consumed;
    });

    // Draw goal reference line (horizontal dashed line across the chart)
    const goalPercent = Math.round((budget / maxVal) * 100);
    weeklyChartWrapper.style.setProperty('--goal-line-pos', `${goalPercent}%`);


    daysData.forEach(d => {
        const col = document.createElement('div');
        col.className = 'chart-bar-column';
        
        const pair = document.createElement('div');
        pair.className = 'bar-pair-container';
        
        const hasData = d.consumed > 0 || d.burned > 0;

        if (!hasData) {
            const emptyBar = document.createElement('div');
            emptyBar.className = 'bar-empty';
            emptyBar.title = 'No data logged';
            pair.appendChild(emptyBar);
        } else {
            // Consumed Bar
            const barCons = document.createElement('div');
            barCons.className = 'bar-consumed';
            const consHeightPercent = Math.round((d.consumed / maxVal) * 100);
            barCons.style.height = `${Math.max(4, consHeightPercent)}%`;
            if (d.net > d.budget) {
                barCons.classList.add('over');
            }
            barCons.title = `Consumed: ${d.consumed} kcal`;

            pair.appendChild(barCons);

            // Burned Bar (only if exercise was logged)
            if (d.burned > 0) {
                const barBurn = document.createElement('div');
                barBurn.className = 'bar-burned-exercise';
                const burnHeightPercent = Math.round((d.burned / maxVal) * 100);
                barBurn.style.height = `${Math.max(4, burnHeightPercent)}%`;
                barBurn.title = `Burned: ${d.burned} kcal`;
                pair.appendChild(barBurn);
            }

            // Value label above column
            const valLabel = document.createElement('span');
            valLabel.className = 'chart-bar-val';
            valLabel.innerText = d.consumed > 999 ? `${(d.consumed/1000).toFixed(1)}k` : d.consumed;
            col.appendChild(valLabel);
        }
        
        const label = document.createElement('span');
        label.className = 'chart-day-label';
        label.innerText = d.dayLabel;
        
        col.appendChild(pair);
        col.appendChild(label);
        weeklyChartWrapper.appendChild(col);
    });


    // Generate Weekly Coach Review Recommendations
    const weeklyCoachContainer = document.getElementById('weekly-recommendations-container');
    weeklyCoachContainer.innerHTML = '';

    const weeklyTips = [];

    // Tip 1: Calorie Consistency
    if (goalMetDays >= 5) {
        weeklyTips.push({
            icon: 'check-circle',
            type: 'success',
            text: `<strong>Target Consistency:</strong> You met your daily calorie budget on ${goalMetDays} out of 7 days. This stable energetic balance is excellent for sustainable weight management.`
        });
    } else {
        weeklyTips.push({
            icon: 'alert-triangle',
            type: 'warning',
            text: `<strong>Target Deficits:</strong> You exceeded your calorie target on ${7 - goalMetDays} days this week. Review your high-calorie snacks and try to plan meals beforehand.`
        });
    }

    // Tip 2: Vegetarian Protein & Sweets Balance
    if (sweetsDays >= 3) {
        weeklyTips.push({
            icon: 'alert-circle',
            type: 'warning',
            text: `<strong>Refined Carbs Alert:</strong> Logged sweets/fried snacks (e.g., Sheera, Samosa) on ${sweetsDays} days. Excess sugar can cause insulin resistance and slow fat loss. Limit sweets to 1-2 days and prioritize high-protein veg alternatives like paneer, Greek yogurt, or sprouts.`
        });
    } else {
        weeklyTips.push({
            icon: 'check-circle',
            type: 'success',
            text: `<strong>Sweets in Moderation:</strong> Great discipline! Sweets/refined treats were kept to a minimum (${sweetsDays} days). This keeps your cravings under control and supports liver metabolic health.`
        });
    }

    // Tip 3: Hydration
    if (avgWater < 2000) {
        weeklyTips.push({
            icon: 'droplet',
            type: 'warning',
            text: `<strong>Dehydration Risk:</strong> Average weekly water intake is low at ${avgWater} ml. Dehydration increases fatigue and causes false hunger. Try to set a daily goal to finish 3 flasks (2.5L) of water.`
        });
    } else {
        weeklyTips.push({
            icon: 'check-circle',
            type: 'success',
            text: `<strong>Solid Hydration:</strong> Your weekly water average is ${avgWater} ml. You met your 2.5L goal on ${highWaterDays} days. Keeping water high promotes calorie-burning efficiency and kidney health.`
        });
    }

    // Tip 4: Workout Consistency
    if (activeDaysCount >= 4) {
        weeklyTips.push({
            icon: 'flame',
            type: 'success',
            text: `<strong>Active Profile:</strong> You logged physical activity on ${activeDaysCount} days this week. This regular routine helps conserve lean tissue and boosts metabolic flexibility.`
        });
    } else {
        weeklyTips.push({
            icon: 'info',
            type: 'info',
            text: `<strong>Activity Nudge:</strong> Logged workouts on ${activeDaysCount} days. To counter your sedentary activity level, aim to schedule a 30-minute brisk walk at least 4 times per week (adds ~720 kcal burned weekly).`
        });
    }

    // Render Weekly Tips
    weeklyTips.forEach(tip => {
        const item = document.createElement('div');
        item.className = 'recommendation-item';
        item.innerHTML = `
            <i data-lucide="${tip.icon}" class="tip-icon ${tip.type}"></i>
            <p>${tip.text}</p>
        `;
        weeklyCoachContainer.appendChild(item);
    });

    lucide.createIcons();
}

// Today / Weekly view switching

// Helper: switch to a view and persist it
function switchView(viewName) {
    localStorage.setItem('chirag_active_view', viewName);
    const isToday = viewName === 'today';
    const isWeekly = viewName === 'weekly';
    viewTodayBtn.classList.toggle('active', isToday);
    viewWeeklyBtn.classList.toggle('active', isWeekly);
    dailyViewContainer.classList.toggle('hidden', !isToday);
    weeklyViewContainer.classList.toggle('hidden', !isWeekly);
    if (isWeekly) renderWeeklyDashboard();
}

// Helper: refresh weekly tab if it's currently visible
function refreshWeeklyIfActive() {
    if (localStorage.getItem('chirag_active_view') === 'weekly') {
        renderWeeklyDashboard();
    }
}

viewTodayBtn.addEventListener('click', () => switchView('today'));
viewWeeklyBtn.addEventListener('click', () => switchView('weekly'));


// ---------------------------------------------------------------------
// Weekly Weight Check Reminder (Monday mornings)

// ---------------------------------------------------------------------
const weightReminderModal = document.getElementById('weight-reminder-modal');
const weightReminderInput = document.getElementById('weight-reminder-input');
const weightReminderPrevVal = document.getElementById('weight-reminder-prev-val');
const weightReminderChangeBadge = document.getElementById('weight-reminder-change-badge');
const weightReminderSaveBtn = document.getElementById('weight-reminder-save-btn');
const weightReminderSkipBtn = document.getElementById('weight-reminder-skip-btn');

function showWeightReminderModal() {
    weightReminderPrevVal.textContent = `${userProfile.weight} kg`;
    weightReminderInput.value = '';
    weightReminderChangeBadge.classList.add('hidden');
    weightReminderChangeBadge.className = 'weight-reminder-change hidden';
    weightReminderModal.classList.add('active');
    lucide.createIcons();
    setTimeout(() => weightReminderInput.focus(), 300);
}

// Live weight change badge as user types
weightReminderInput.addEventListener('input', () => {
    const newW = parseFloat(weightReminderInput.value);
    const oldW = parseFloat(userProfile.weight);
    if (!weightReminderInput.value || isNaN(newW)) {
        weightReminderChangeBadge.classList.add('hidden');
        return;
    }
    const diff = Math.round((newW - oldW) * 10) / 10;
    weightReminderChangeBadge.classList.remove('hidden', 'loss', 'gain', 'same');
    if (diff < 0) {
        weightReminderChangeBadge.classList.add('loss');
        weightReminderChangeBadge.textContent = `🎉 Down ${Math.abs(diff)} kg from last check — amazing progress!`;
    } else if (diff > 0) {
        weightReminderChangeBadge.classList.add('gain');
        weightReminderChangeBadge.textContent = `📈 Up ${diff} kg — adjust diet and keep going!`;
    } else {
        weightReminderChangeBadge.classList.add('same');
        weightReminderChangeBadge.textContent = `⚖️ No change — consistency is still progress!`;
    }
});

// Save button: update weight and recalculate everything
weightReminderSaveBtn.addEventListener('click', () => {
    const newW = parseFloat(weightReminderInput.value);
    if (!weightReminderInput.value || isNaN(newW) || newW < 30 || newW > 300) {
        weightReminderInput.style.borderColor = 'var(--accent-rose)';
        weightReminderInput.placeholder = 'Enter a valid weight (30–300 kg)';
        setTimeout(() => { weightReminderInput.style.borderColor = ''; }, 1500);
        return;
    }
    // Persist new weight and mark check done
    userProfile.weight = newW;
    userProfile.lastWeightCheckDate = getLocalDateString();
    localStorage.setItem('chirag_profile', JSON.stringify(userProfile));

    // Recalculate dashboard and macros
    renderDashboard();
    generateCoachRecommendations(true);

    // Close modal
    weightReminderModal.classList.remove('active');

    // Brief confirmation toast
    const toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:linear-gradient(135deg,rgba(16,185,129,0.9),rgba(5,150,105,0.9));color:#fff;padding:10px 20px;border-radius:24px;font-size:0.85rem;font-weight:600;z-index:10000;box-shadow:0 8px 24px rgba(0,0,0,0.4);pointer-events:none;transition:opacity 0.4s;';
    toast.textContent = `✅ Weight updated to ${newW} kg — macros recalculated!`;
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 400); }, 2800);
});

// Skip button: mark as done for this week — won't show again until next Monday
weightReminderSkipBtn.addEventListener('click', () => {
    // Save today so modal never re-fires this same Monday
    userProfile.lastWeightCheckDate = getLocalDateString();
    localStorage.setItem('chirag_profile', JSON.stringify(userProfile));
    weightReminderModal.classList.remove('active');
});

// Dismiss on backdrop click — also saves date
weightReminderModal.addEventListener('click', (e) => {
    if (e.target === weightReminderModal) {
        userProfile.lastWeightCheckDate = getLocalDateString();
        localStorage.setItem('chirag_profile', JSON.stringify(userProfile));
        weightReminderModal.classList.remove('active');
    }
});

// Check if we should show the Monday reminder
// Logic: show only on Mondays, and only if we haven't already logged/skipped THIS Monday
function checkMondayWeightReminder() {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday
    if (dayOfWeek !== 1) return; // Only on Mondays

    const todayStr = getLocalDateString(now);
    const lastCheck = userProfile.lastWeightCheckDate || '';

    // lastCheck is already this Monday → already handled, skip
    if (lastCheck === todayStr) return;

    // Show with a small delay so the app renders first
    setTimeout(showWeightReminderModal, 800);
}

// ---------------------------------------------------------------------
// Application Initialization
// ---------------------------------------------------------------------
updateDateDisplay();
renderDashboard();
generateCoachRecommendations(false);
checkMondayWeightReminder();

// Restore the last active view (persists across refreshes)
const rawSavedView = localStorage.getItem('chirag_active_view') || 'today';
const savedView = (rawSavedView === 'transform') ? 'today' : rawSavedView;
switchView(savedView);

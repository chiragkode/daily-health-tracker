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
const customGoalGroup = document.getElementById('custom-goal-group');
const profGoalType = document.getElementById('prof-goal-type');
const coachBtn = document.getElementById('trigger-coach-btn');
const clearDayBtn = document.getElementById('clear-day-btn');
const prevDayBtn = document.getElementById('prev-day-btn');
const nextDayBtn = document.getElementById('next-day-btn');
const waterResetBtn = document.getElementById('water-reset-btn');

// Initial defaults based on User profile (90kg, 5'7", Male, 29, Sedentary)
const defaultProfile = {
    weight: 90,
    height: 67, // inches (approx 170cm)
    age: 29,
    sex: 'male',
    activityLevel: 1.2,
    goalType: 'maintenance',
    customGoal: 2000,
    isVegetarian: true
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

// Seed initial demo data for "today" (May 25, 2026 / current date) if local storage is completely empty
let dailyLogs = JSON.parse(localStorage.getItem('chirag_logs')) || {};

// If there are no logs at all, seed today's entry and the past 6 days with realistic Indian Veg data
if (Object.keys(dailyLogs).length === 0) {
    const today = new Date();
    const sampleData = [
        // Today (Day 0)
        {
            food: [
                { name: '1 plate Sheera', calories: 500, protein: 4.8, fat: 18, carbs: 78, meal: 'Snack' },
                { name: '1 tall Iced Americano', calories: 5, protein: 0.2, fat: 0, carbs: 0.8, meal: 'Snack' }
            ],
            exercise: [],
            water: 500
        },
        // Yesterday (Day -1)
        {
            food: [
                { name: 'Masala Dosa with Sambar', calories: 350, protein: 6.5, fat: 10, carbs: 58, meal: 'Breakfast' },
                { name: 'Dal Tadka / Fry (1 bowl)', calories: 150, protein: 7.5, fat: 5, carbs: 19, meal: 'Lunch' },
                { name: 'Basmati Rice (1 bowl)', calories: 200, protein: 4.2, fat: 0.4, carbs: 44, meal: 'Lunch' },
                { name: 'Cucumber Salad (1 bowl)', calories: 30, protein: 0.8, fat: 0.2, carbs: 6.2, meal: 'Lunch' },
                { name: 'Dhokla (2 pcs)', calories: 120, protein: 4.5, fat: 3.2, carbs: 18, meal: 'Snack' },
                { name: 'Khichdi (1 bowl)', calories: 220, protein: 6.8, fat: 4.5, carbs: 38, meal: 'Dinner' }
            ],
            exercise: [
                { name: 'Brisk Walking', duration: 30, calories: 180 }
            ],
            water: 2500
        },
        // Day -2
        {
            food: [
                { name: 'Poha (1 plate)', calories: 250, protein: 4.5, fat: 7.8, carbs: 41, meal: 'Breakfast' },
                { name: 'Mix Veg Sabzi (1 bowl)', calories: 120, protein: 2.8, fat: 6.5, carbs: 13, meal: 'Lunch' },
                { name: 'Roti (2 pcs)', calories: 160, protein: 6, fat: 1, carbs: 30, meal: 'Lunch' },
                { name: 'Buttermilk / Chaas (1 glass)', calories: 45, protein: 2.2, fat: 1.5, carbs: 4.8, meal: 'Lunch' },
                { name: 'Paneer Butter Masala (1 bowl)', calories: 280, protein: 10.5, fat: 22, carbs: 10, meal: 'Dinner' },
                { name: 'Roti (2 pcs)', calories: 160, protein: 6, fat: 1, carbs: 30, meal: 'Dinner' }
            ],
            exercise: [],
            water: 1800
        },
        // Day -3
        {
            food: [
                { name: 'Plain Paratha (1 pc)', calories: 150, protein: 3.5, fat: 6, carbs: 21, meal: 'Breakfast' },
                { name: 'Greek Yogurt / Curd (1 cup)', calories: 100, protein: 8.5, fat: 3.2, carbs: 6, meal: 'Breakfast' },
                { name: 'Veg Biryani (1 plate)', calories: 300, protein: 6.5, fat: 8.5, carbs: 50, meal: 'Lunch' },
                { name: 'Buttermilk / Chaas (1 glass)', calories: 45, protein: 2.2, fat: 1.5, carbs: 4.8, meal: 'Lunch' },
                { name: 'Palak Paneer (1 bowl)', calories: 220, protein: 9.8, fat: 15, carbs: 8.5, meal: 'Dinner' },
                { name: 'Roti (1 pc)', calories: 80, protein: 3, fat: 0.5, carbs: 15, meal: 'Dinner' }
            ],
            exercise: [
                { name: 'Weight Training', duration: 45, calories: 250 }
            ],
            water: 2600
        },
        // Day -4
        {
            food: [
                { name: 'Idli (2 pcs) with Sambar', calories: 180, protein: 5.5, fat: 1.2, carbs: 36, meal: 'Breakfast' },
                { name: 'Dal Tadka / Fry (1 bowl)', calories: 150, protein: 7.5, fat: 5, carbs: 19, meal: 'Lunch' },
                { name: 'Basmati Rice (1 bowl)', calories: 200, protein: 4.2, fat: 0.4, carbs: 44, meal: 'Lunch' },
                { name: 'Cucumber Salad (1 bowl)', calories: 30, protein: 0.8, fat: 0.2, carbs: 6.2, meal: 'Lunch' },
                { name: 'Sheera / Halwa (1 plate)', calories: 500, protein: 4.8, fat: 18, carbs: 78, meal: 'Snack' },
                { name: 'Khichdi (1 bowl)', calories: 220, protein: 6.8, fat: 4.5, carbs: 38, meal: 'Dinner' }
            ],
            exercise: [
                { name: 'Brisk Walking', duration: 30, calories: 180 }
            ],
            water: 1500
        },
        // Day -5
        {
            food: [
                { name: 'Upma (1 plate)', calories: 220, protein: 4.8, fat: 6.2, carbs: 36, meal: 'Breakfast' },
                { name: 'Paneer Tikka (1 plate)', calories: 300, protein: 15, fat: 22, carbs: 8, meal: 'Lunch' },
                { name: 'Cucumber Salad (1 bowl)', calories: 30, protein: 0.8, fat: 0.2, carbs: 6.2, meal: 'Lunch' },
                { name: 'Greek Yogurt / Curd (1 cup)', calories: 100, protein: 8.5, fat: 3.2, carbs: 6, meal: 'Snack' },
                { name: 'Mix Veg Sabzi (1 bowl)', calories: 120, protein: 2.8, fat: 6.5, carbs: 13, meal: 'Dinner' },
                { name: 'Roti (2 pcs)', calories: 160, protein: 6, fat: 1, carbs: 30, meal: 'Dinner' }
            ],
            exercise: [],
            water: 2400
        },
        // Day -6
        {
            food: [
                { name: 'Plain Dosa with Sambar', calories: 250, protein: 5.2, fat: 6.5, carbs: 42, meal: 'Breakfast' },
                { name: 'Chole Rice (1 plate)', calories: 410, protein: 10.8, fat: 7.2, carbs: 75, meal: 'Lunch' },
                { name: 'Samosa (1 pc)', calories: 150, protein: 2.5, fat: 9, carbs: 16, meal: 'Snack' },
                { name: 'Palak Paneer (1 bowl)', calories: 220, protein: 9.8, fat: 15, carbs: 8.5, meal: 'Dinner' },
                { name: 'Roti (1 pc)', calories: 80, protein: 3, fat: 0.5, carbs: 15, meal: 'Dinner' }
            ],
            exercise: [
                { name: 'Jogging', duration: 20, calories: 200 }
            ],
            water: 2000
        }
    ];

    sampleData.forEach((dayInfo, index) => {
        const d = new Date();
        d.setDate(today.getDate() - index);
        const dateStr = getLocalDateString(d);
        dailyLogs[dateStr] = dayInfo;
    });

    localStorage.setItem('chirag_logs', JSON.stringify(dailyLogs));
}

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
    if (userProfile.goalType === 'deficit') {
        return tdee - 500;
    } else if (userProfile.goalType === 'custom') {
        return parseInt(userProfile.customGoal) || 2000;
    }
    return tdee; // Maintenance
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

    const proteinTarget = Math.round(budget * 0.20 / 4);
    const carbsTarget = Math.round(budget * 0.50 / 4);
    const fatsTarget = Math.round(budget * 0.30 / 9);

    document.getElementById('macro-protein-val').innerText = `${totalProtein}g / ${proteinTarget}g`;
    document.getElementById('macro-carbs-val').innerText = `${totalCarbs}g / ${carbsTarget}g`;
    document.getElementById('macro-fats-val').innerText = `${totalFats}g / ${fatsTarget}g`;

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
    document.querySelector('.profile-name').innerText = `${weight}kg • ${heightFeet}'${heightInches}"`;
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
        // Recalculate live coach recommendations
        generateCoachRecommendations(false);
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
    
    // Reset form and status msg
    const statusMsg = document.getElementById('food-status-msg');
    statusMsg.classList.add('hidden');
    statusMsg.innerText = '';
    
    foodForm.reset();
    foodServingsInput.value = 1;
    baseCalories = 0;
    baseMacros = null;
    tempMacros = null;
    generateCoachRecommendations(false); // Update recommendations live silently
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
            const url = `https://corsproxy.io/?` + encodeURIComponent(targetUrl);
            
            const response = await fetch(url, {
                headers: { 'X-Api-Key': apiKey }
            });
            
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
exerciseForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('exercise-name').value;
    const duration = parseInt(document.getElementById('exercise-duration').value);
    const calories = parseInt(document.getElementById('exercise-calories').value);

    if (!dailyLogs[activeDateStr]) dailyLogs[activeDateStr] = { food: [], exercise: [], water: 0 };
    dailyLogs[activeDateStr].exercise.push({ name, duration, calories });

    saveLogs();
    renderDashboard();

    exerciseForm.reset();
    generateCoachRecommendations(false);
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
        generateCoachRecommendations(false);
    });
});

// Water Reset
waterResetBtn.addEventListener('click', () => {
    if (dailyLogs[activeDateStr]) {
        dailyLogs[activeDateStr].water = 0;
        saveLogs();
        renderDashboard();
        generateCoachRecommendations(false);
    }
});

// Clear Day Journal
clearDayBtn.addEventListener('click', () => {
    if (confirm("Are you sure you want to clear today's food, water, and workouts?")) {
        dailyLogs[activeDateStr] = { food: [], exercise: [], water: 0 };
        saveLogs();
        renderDashboard();
        generateCoachRecommendations(true);
    }
});

// Date navigation
prevDayBtn.addEventListener('click', () => {
    currentDayOffset--;
    updateDateDisplay();
    renderDashboard();
    generateCoachRecommendations(false);
});

nextDayBtn.addEventListener('click', () => {
    currentDayOffset++;
    updateDateDisplay();
    renderDashboard();
    generateCoachRecommendations(false);
});

// Profile Modal triggers
profilePillTrigger.addEventListener('click', () => {
    // Populate form with current values
    document.getElementById('prof-weight').value = userProfile.weight;
    document.getElementById('prof-height').value = userProfile.height;
    document.getElementById('prof-age').value = userProfile.age;
    document.getElementById('prof-sex').value = userProfile.sex;
    document.getElementById('prof-activity').value = userProfile.activityLevel;
    document.getElementById('prof-goal-type').value = userProfile.goalType;
    document.getElementById('prof-custom-goal').value = userProfile.customGoal;
    document.getElementById('prof-api-key').value = userProfile.apiKey || '';
    
    if (userProfile.goalType === 'custom') {
        customGoalGroup.classList.remove('hidden');
    } else {
        customGoalGroup.classList.add('hidden');
    }
    
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

profGoalType.addEventListener('change', () => {
    if (profGoalType.value === 'custom') {
        customGoalGroup.classList.remove('hidden');
    } else {
        customGoalGroup.classList.add('hidden');
    }
});

profileForm.addEventListener('submit', (e) => {
    e.preventDefault();
    userProfile.weight = parseFloat(document.getElementById('prof-weight').value);
    userProfile.height = parseFloat(document.getElementById('prof-height').value);
    userProfile.age = parseInt(document.getElementById('prof-age').value);
    userProfile.sex = document.getElementById('prof-sex').value;
    userProfile.activityLevel = parseFloat(document.getElementById('prof-activity').value);
    userProfile.goalType = document.getElementById('prof-goal-type').value;
    userProfile.customGoal = parseInt(document.getElementById('prof-custom-goal').value);
    userProfile.apiKey = document.getElementById('prof-api-key').value.trim();

    localStorage.setItem('chirag_profile', JSON.stringify(userProfile));
    profileModal.classList.remove('active');
    
    renderDashboard();
    generateCoachRecommendations(true);
});

// ---------------------------------------------------------------------
// Rule-Based Coach Intelligence Engine
// ---------------------------------------------------------------------
function generateCoachRecommendations(userInitiated = true) {
    const dayData = dailyLogs[activeDateStr] || { food: [], exercise: [], water: 0 };
    const totalConsumed = dayData.food.reduce((sum, item) => sum + parseInt(item.calories || 0), 0);
    const totalBurned = dayData.exercise.reduce((sum, item) => sum + parseInt(item.calories || 0), 0);
    const totalWater = dayData.water || 0;
    const budget = getCalorieBudget();
    const netCalories = totalConsumed - totalBurned;

    const recommendations = [];

    // Rule 1: Sweets or calorie-dense items flag (Sheera, Halwa, Cake, Sugar, Jalebi)
    const sweetsFound = dayData.food.some(item => {
        const name = item.name.toLowerCase();
        return name.includes('sheera') || name.includes('halwa') || name.includes('sweet') || name.includes('sugar') || name.includes('cake') || name.includes('dessert') || name.includes('jalebi') || name.includes('mithai');
    });

    if (sweetsFound) {
        recommendations.push({
            icon: 'alert-triangle',
            type: 'warning',
            text: '<strong>Glycemic Impact:</strong> Sweet items (like Sheera) can spike insulin. For your next meal, focus on lean vegetarian protein (e.g., paneer, tofu, soya chunks, Greek yogurt, or sprouts) and fiber to prevent cravings and stabilize energy.'
        });
    }

    // Rule 2: Water level warning
    if (totalWater < 1000) {
        recommendations.push({
            icon: 'droplet',
            type: 'warning',
            text: `<strong>Critical Hydration:</strong> Hydration is low at ${totalWater} ml. Fat oxidation and recovery slow down under mild dehydration. Drink two full glasses (500ml) right away.`
        });
    } else if (totalWater < 2500) {
        recommendations.push({
            icon: 'info',
            type: 'info',
            text: `<strong>Hydration Progress:</strong> You have logged ${totalWater} ml. Boost this by another ${2500 - totalWater} ml to reach your daily metabolic hydration baseline of 2.5L.`
        });
    } else {
        recommendations.push({
            icon: 'check-circle',
            type: 'success',
            text: '<strong>Excellent Hydration:</strong> You met your daily water threshold! Drinking 2.5L+ ensures stable cellular performance and kidney filtration.'
        });
    }

    // Rule 3: Exercise/Sedentary check
    if (totalBurned === 0) {
        recommendations.push({
            icon: 'flame',
            type: 'warning',
            text: '<strong>Sedentary Day:</strong> Your baseline metabolism benefits immensely from NEAT (Non-Exercise Activity Thermogenesis). Try to add a 30-minute brisk walk today (approx. 180 kcal burned).'
        });
    } else {
        recommendations.push({
            icon: 'check-circle',
            type: 'success',
            text: `<strong>Active Status:</strong> Great work logging workouts (${totalBurned} kcal burned). Physical activity boosts cardiorespiratory fitness and creates an energy buffer.`
        });
    }

    // Rule 4: Caloric boundary alerts
    if (netCalories > budget) {
        const overLimit = Math.round(netCalories - budget);
        recommendations.push({
            icon: 'alert-circle',
            type: 'warning',
            text: `<strong>Calorie Surplus:</strong> You are currently ${overLimit} kcal over budget. Consider adding 15-20 minutes of light jogging or high-knees to bring down the net balance.`
        });
    } else if (totalConsumed > 0 && netCalories < budget * 0.5) {
        recommendations.push({
            icon: 'sparkles',
            type: 'success',
            text: `<strong>Sustainable Balance:</strong> You have consumed ${totalConsumed} kcal and remain under target. Prioritize high-volume nutrient-dense food if you have another meal today.`
        });
    } else if (totalConsumed === 0) {
        recommendations.push({
            icon: 'info',
            type: 'info',
            text: '<strong>Awaiting Logs:</strong> Food is fuel. Ensure you log all ingredients, snacks, and condiments throughout the day for accurate feedback.'
        });
    }

    // Render Recommendations
    recommendationsContainer.innerHTML = '';
    recommendations.slice(0, 3).forEach(rec => {
        const div = document.createElement('div');
        div.className = 'recommendation-item';
        div.innerHTML = `
            <i data-lucide="${rec.icon}" class="tip-icon ${rec.type}"></i>
            <p>${rec.text}</p>
        `;
        recommendationsContainer.appendChild(div);
    });

    // Recreate Lucide icons inside recommendations
    lucide.createIcons();

    if (userInitiated) {
        // Scroll recommendations panel into view on mobile
        document.querySelector('.recommendations-panel').scrollIntoView({ behavior: 'smooth' });
    }
}

// Bind recommendation trigger button
coachBtn.addEventListener('click', () => {
    generateCoachRecommendations(true);
});

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

    // Render chart bars
    weeklyChartWrapper.innerHTML = '';
    
    // Find maximum value to scale heights (with a baseline of 2000)
    let maxVal = 2000;
    daysData.forEach(d => {
        if (d.consumed > maxVal) maxVal = d.consumed;
        if (d.budget > maxVal) maxVal = d.budget;
    });

    daysData.forEach(d => {
        const col = document.createElement('div');
        col.className = 'chart-bar-column';
        
        const pair = document.createElement('div');
        pair.className = 'bar-pair-container';
        
        // Consumed Bar
        const barCons = document.createElement('div');
        barCons.className = 'bar-consumed';
        const consHeightPercent = Math.max(2, Math.round((d.consumed / maxVal) * 100));
        barCons.style.height = `${consHeightPercent}%`;
        if (d.net > d.budget) {
            barCons.classList.add('over');
        }
        barCons.title = `Consumed: ${d.consumed} kcal`;
        
        // Budget Bar
        const barBudg = document.createElement('div');
        barBudg.className = 'bar-budget';
        const budgHeightPercent = Math.max(2, Math.round((d.budget / maxVal) * 100));
        barBudg.style.height = `${budgHeightPercent}%`;
        barBudg.title = `Goal: ${d.budget} kcal`;
        
        pair.appendChild(barCons);
        pair.appendChild(barBudg);
        
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
const viewTodayBtn = document.getElementById('view-today-btn');
const viewWeeklyBtn = document.getElementById('view-weekly-btn');
const dailyViewContainer = document.getElementById('daily-view-container');
const weeklyViewContainer = document.getElementById('weekly-view-container');

viewTodayBtn.addEventListener('click', () => {
    viewTodayBtn.classList.add('active');
    viewWeeklyBtn.classList.remove('active');
    dailyViewContainer.classList.remove('hidden');
    weeklyViewContainer.classList.add('hidden');
});

viewWeeklyBtn.addEventListener('click', () => {
    viewWeeklyBtn.classList.add('active');
    viewTodayBtn.classList.remove('active');
    dailyViewContainer.classList.add('hidden');
    weeklyViewContainer.classList.remove('hidden');
    renderWeeklyDashboard();
});

// ---------------------------------------------------------------------
// Application Initialization
// ---------------------------------------------------------------------
updateDateDisplay();
renderDashboard();
generateCoachRecommendations(false);

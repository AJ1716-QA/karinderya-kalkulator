/* =========================================================
   KARINDERYA KALKULATOR
   MOBILE-FIRST VERSION
========================================================= */


/* =========================================================
   LOCAL STORAGE
========================================================= */

let savedRecipes = JSON.parse(localStorage.getItem("savedRecipes")) || [];
let savedMenus = JSON.parse(localStorage.getItem("savedMenus")) || [];
let ingredientPrices = JSON.parse(localStorage.getItem("ingredientPrices")) || [];
let dailySalesRecords = JSON.parse(localStorage.getItem("dailySalesRecords")) || [];


/* =========================================================
   DATE
========================================================= */

function getLocalDateString() {
    const date = new Date();

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


/* =========================================================
   MONEY
========================================================= */

function formatMoney(value) {
    return "₱" + Number(value || 0).toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
}


/* =========================================================
   UNIT DEFINITIONS
========================================================= */

const unitDefinitions = {

    kg: {
        type: "weight",
        base: "g",
        multiplier: 1000,
        label: "KG"
    },

    g: {
        type: "weight",
        base: "g",
        multiplier: 1,
        label: "Gram"
    },

    l: {
        type: "volume",
        base: "ml",
        multiplier: 1000,
        label: "Liter"
    },

    ml: {
        type: "volume",
        base: "ml",
        multiplier: 1,
        label: "ML"
    },

    cup: {
        type: "volume",
        base: "ml",
        multiplier: 240,
        label: "Cup"
    },

    tbsp: {
        type: "volume",
        base: "ml",
        multiplier: 15,
        label: "TBSP"
    },

    tsp: {
        type: "volume",
        base: "ml",
        multiplier: 5,
        label: "TSP"
    },

    piece: {
        type: "count",
        base: "piece",
        multiplier: 1,
        label: "Piece"
    },

    dozen: {
        type: "count",
        base: "piece",
        multiplier: 12,
        label: "Dozen"
    },

    bottle: {
        type: "package",
        base: "bottle",
        multiplier: 1,
        label: "Bottle"
    },

    can: {
        type: "package",
        base: "can",
        multiplier: 1,
        label: "Can"
    },

    pack: {
        type: "package",
        base: "pack",
        multiplier: 1,
        label: "Pack"
    },

    sachet: {
        type: "package",
        base: "sachet",
        multiplier: 1,
        label: "Sachet"
    }

};


/* =========================================================
   UNIT CONVERSION
========================================================= */

function canConvertUnits(fromUnit, toUnit) {

    if (!unitDefinitions[fromUnit] || !unitDefinitions[toUnit]) {
        return false;
    }

    return unitDefinitions[fromUnit].type === unitDefinitions[toUnit].type;
}


function convertUnit(quantity, fromUnit, toUnit) {

    if (!canConvertUnits(fromUnit, toUnit)) {
        return null;
    }

    const from = unitDefinitions[fromUnit];
    const to = unitDefinitions[toUnit];

    const baseQuantity = Number(quantity) * from.multiplier;

    return baseQuantity / to.multiplier;
}


function calculateIngredientCost(
    recipeQuantity,
    recipeUnit,
    purchasePrice,
    purchaseQuantity,
    purchaseUnit
) {

    if (!canConvertUnits(recipeUnit, purchaseUnit)) {
        return null;
    }

    const purchaseInRecipeUnit = convertUnit(
        purchaseQuantity,
        purchaseUnit,
        recipeUnit
    );

    if (
        purchaseInRecipeUnit === null ||
        purchaseInRecipeUnit <= 0
    ) {
        return null;
    }

    return (
        Number(recipeQuantity) *
        Number(purchasePrice) /
        Number(purchaseInRecipeUnit)
    );
}


/* =========================================================
   NAVIGATION
========================================================= */

function showScreen(screenId) {

    document.querySelectorAll(".screen").forEach(screen => {
        screen.classList.remove("active");
    });

    const screen = document.getElementById(screenId);

    if (screen) {
        screen.classList.add("active");
    }

    window.scrollTo({
        top: 0,
        behavior: "instant"
    });

    if (screenId === "recipeScreen") {
        initializeRecipeScreen();
    }

    if (screenId === "menuScreen") {
        initializeMenuScreen();
    }

    if (screenId === "salesScreen") {
        initializeSalesScreen();
    }

    if (screenId === "pricesScreen") {
        renderIngredientPrices();
    }

    if (screenId === "recordsScreen") {
        renderSavedRecords();
    }

    if (screenId === "homeScreen") {
        updateTodaySummary();
    }
}


/* =========================================================
   MODAL
========================================================= */

let modalConfirmCallback = null;


function showConfirm(title, message, callback) {

    document.getElementById("modalTitle").textContent = title;
    document.getElementById("modalMessage").textContent = message;

    modalConfirmCallback = callback;

    document
        .getElementById("confirmModal")
        .classList.add("active");
}


function closeConfirmModal() {

    document
        .getElementById("confirmModal")
        .classList.remove("active");

    modalConfirmCallback = null;
}


document.getElementById("modalYes").addEventListener("click", function () {

    if (typeof modalConfirmCallback === "function") {
        modalConfirmCallback();
    }

    closeConfirmModal();

});


document.getElementById("modalNo").addEventListener("click", function () {

    closeConfirmModal();

});


/* =========================================================
   RECIPE COST
========================================================= */

function initializeRecipeScreen() {

    const dateInput = document.getElementById("recipeDate");

    if (!dateInput.value) {
        dateInput.value = getLocalDateString();
    }

    if (
        document.getElementById("ingredientContainer").children.length === 0
    ) {
        addIngredientRow();
    }

    calculateRecipeTotal();
}


function addIngredientRow() {

    const container =
        document.getElementById("ingredientContainer");

    const row = document.createElement("div");

    row.className = "ingredient-row";

    row.innerHTML = `

        <div class="ingredient-header">

            <span class="ingredient-number">
                Ingredient ${container.children.length + 1}
            </span>

            <button
                class="remove-small-button"
                onclick="removeIngredientRow(this)"
            >
                ×
            </button>

        </div>


        <div class="form-group">

            <label class="form-label">
                Ingredient
            </label>

            <select class="recipe-ingredient"
                    onchange="calculateRecipeRow(this)">

                <option value="">
                    Select ingredient
                </option>

            </select>

        </div>


        <div class="form-group">

            <label class="form-label">
                Amount Used
            </label>

            <input
                type="number"
                class="recipe-amount"
                inputmode="decimal"
                min="0"
                step="any"
                placeholder="Example: 500"
                oninput="calculateRecipeRow(this)"
            >

        </div>


        <div class="form-group">

            <label class="form-label">
                Unit
            </label>

            <select
                class="recipe-unit"
                onchange="calculateRecipeRow(this)"
            >

                <option value="kg">KG</option>
                <option value="g">Gram</option>
                <option value="l">Liter</option>
                <option value="ml">ML</option>
                <option value="cup">Cup</option>
                <option value="tbsp">TBSP</option>
                <option value="tsp">TSP</option>
                <option value="piece">Piece</option>
                <option value="dozen">Dozen</option>
                <option value="bottle">Bottle</option>
                <option value="can">Can</option>
                <option value="pack">Pack</option>
                <option value="sachet">Sachet</option>

            </select>

        </div>


        <div class="ingredient-cost">
            Cost: <span class="row-cost">₱0.00</span>
        </div>

    `;

    container.appendChild(row);

    populateIngredientSelect(
        row.querySelector(".recipe-ingredient")
    );

}


function populateIngredientSelect(select) {

    select.innerHTML = `
        <option value="">
            Select ingredient
        </option>
    `;

    ingredientPrices.forEach(item => {

        const option = document.createElement("option");

        option.value = item.id;

        option.textContent =
            `${item.name} — ${formatMoney(item.price)} / ${item.quantity} ${unitDefinitions[item.unit]?.label || item.unit}`;

        select.appendChild(option);

    });

}


function removeIngredientRow(button) {

    const row = button.closest(".ingredient-row");

    if (row) {
        row.remove();
    }

    renumberIngredients();

    calculateRecipeTotal();
}


function renumberIngredients() {

    document
        .querySelectorAll(".ingredient-row")
        .forEach((row, index) => {

            const number =
                row.querySelector(".ingredient-number");

            number.textContent =
                `Ingredient ${index + 1}`;

        });

}


function calculateRecipeRow(element) {

    const row = element.closest(".ingredient-row");

    if (!row) {
        return;
    }

    const ingredientId =
        row.querySelector(".recipe-ingredient").value;

    const amount =
        Number(row.querySelector(".recipe-amount").value);

    const unit =
        row.querySelector(".recipe-unit").value;

    const costDisplay =
        row.querySelector(".row-cost");

    const ingredient =
        ingredientPrices.find(
            item => String(item.id) === String(ingredientId)
        );

    if (
        !ingredient ||
        !amount ||
        amount <= 0
    ) {

        costDisplay.textContent = "₱0.00";

        calculateRecipeTotal();

        return;
    }

    const cost = calculateIngredientCost(
        amount,
        unit,
        ingredient.price,
        ingredient.quantity,
        ingredient.unit
    );

    if (cost === null) {

        costDisplay.textContent =
            "Unit mismatch";

    } else {

        costDisplay.textContent =
            formatMoney(cost);

    }

    calculateRecipeTotal();
}


function calculateRecipeTotal() {

    let total = 0;

    document
        .querySelectorAll(".ingredient-row")
        .forEach(row => {

            const ingredientId =
                row.querySelector(".recipe-ingredient").value;

            const amount =
                Number(row.querySelector(".recipe-amount").value);

            const unit =
                row.querySelector(".recipe-unit").value;

            const ingredient =
                ingredientPrices.find(
                    item =>
                        String(item.id) === String(ingredientId)
                );

            if (
                ingredient &&
                amount > 0
            ) {

                const cost =
                    calculateIngredientCost(
                        amount,
                        unit,
                        ingredient.price,
                        ingredient.quantity,
                        ingredient.unit
                    );

                if (cost !== null) {
                    total += cost;
                }

            }

        });

    document.getElementById("recipeTotalCost")
        .textContent = formatMoney(total);

    return total;
}


function saveRecipe() {

    const date =
        document.getElementById("recipeDate").value;

    const name =
        document.getElementById("recipeName").value.trim();

    if (!date) {
        alert("Please select the recipe date.");
        return;
    }

    if (!name) {
        alert("Please enter the recipe name.");
        return;
    }

    const rows =
        document.querySelectorAll(".ingredient-row");

    const ingredients = [];

    rows.forEach(row => {

        const ingredientId =
            row.querySelector(".recipe-ingredient").value;

        const amount =
            Number(row.querySelector(".recipe-amount").value);

        const unit =
            row.querySelector(".recipe-unit").value;

        const ingredient =
            ingredientPrices.find(
                item =>
                    String(item.id) === String(ingredientId)
            );

        if (
            ingredient &&
            amount > 0
        ) {

            const cost =
                calculateIngredientCost(
                    amount,
                    unit,
                    ingredient.price,
                    ingredient.quantity,
                    ingredient.unit
                );

            if (cost !== null) {

                ingredients.push({
                    ingredientId: ingredient.id,
                    ingredientName: ingredient.name,
                    amount: amount,
                    unit: unit,
                    cost: cost
                });

            }

        }

    });

    if (ingredients.length === 0) {
        alert("Please add at least one valid ingredient.");
        return;
    }

    const totalCost =
        ingredients.reduce(
            (sum, item) => sum + Number(item.cost),
            0
        );

    const recipe = {

        id: Date.now(),

        date: date,

        name: name,

        totalCost: totalCost,

        ingredients: ingredients

    };

    savedRecipes.push(recipe);

    localStorage.setItem(
        "savedRecipes",
        JSON.stringify(savedRecipes)
    );

    alert(
        `${name} saved successfully.\n\nTotal Recipe Cost: ${formatMoney(totalCost)}`
    );

    resetRecipeForm();
}


function resetRecipeForm() {

    document.getElementById("recipeName").value = "";

    document.getElementById("ingredientContainer").innerHTML = "";

    addIngredientRow();

    calculateRecipeTotal();
}


/* =========================================================
   MENU OF THE DAY
========================================================= */

function initializeMenuScreen() {

    const dateInput =
        document.getElementById("menuDate");

    if (!dateInput.value) {
        dateInput.value = getLocalDateString();
    }

    loadMenuOfDay();
}


function getRecipesForDate(date) {

    return savedRecipes.filter(
        recipe => recipe.date === date
    );

}


function getSavedMenu(date) {

    return savedMenus.find(
        menu => menu.date === date
    );

}


function loadMenuOfDay() {

    const date =
        document.getElementById("menuDate").value;

    const container =
        document.getElementById("menuItemsContainer");

    container.innerHTML = "";

    if (!date) {
        return;
    }

    const recipes =
        getRecipesForDate(date);

    if (recipes.length === 0) {

        container.innerHTML = `
            <div class="empty-message">
                No recipes have been saved for this date.
            </div>
        `;

        document.getElementById("menuTotalsContainer").innerHTML = "";

        return;
    }

    const savedMenu =
        getSavedMenu(date);

    renderMenuItems(recipes, savedMenu);

    calculateMenuTotals();
}


function renderMenuItems(recipes, savedMenu) {

    const container =
        document.getElementById("menuItemsContainer");

    container.innerHTML = "";

    recipes.forEach(recipe => {

        const savedItem =
            savedMenu?.items?.find(
                item => item.recipeId === recipe.id
            );

        const servings =
            savedItem?.servings || "";

        const sellingPrice =
            savedItem?.sellingPrice || "";

        const card =
            document.createElement("div");

        card.className = "menu-card";

        card.dataset.recipeId = recipe.id;

        card.innerHTML = `

            <div class="menu-name">
                ${escapeHtml(recipe.name)}
            </div>

            <div class="menu-recipe-cost">
                Recipe Cost: <strong>
                    ${formatMoney(recipe.totalCost)}
                </strong>
            </div>


            <div class="menu-input-grid">

                <div>
                    <label class="form-label">
                        Servings
                    </label>

                    <input
                        type="number"
                        class="menu-servings"
                        inputmode="numeric"
                        min="1"
                        value="${servings}"
                        placeholder="Example: 20"
                        oninput="updateMenuRow(this)"
                    >
                </div>


                <div>
                    <label class="form-label">
                        Price / Serving
                    </label>

                    <input
                        type="number"
                        class="menu-price"
                        inputmode="decimal"
                        min="0"
                        step="any"
                        value="${sellingPrice}"
                        placeholder="Example: 40"
                        oninput="updateMenuRow(this)"
                    >
                </div>

            </div>


            <div class="menu-result">

                <div class="result-line">
                    <span>Cost / Serving</span>
                    <strong class="menu-cost-serving">
                        ₱0.00
                    </strong>
                </div>

                <div class="result-line">
                    <span>Profit / Serving</span>
                    <strong class="menu-profit-serving">
                        ₱0.00
                    </strong>
                </div>

                <div class="result-line profit">
                    <span>Total Profit</span>
                    <strong class="menu-total-profit">
                        ₱0.00
                    </strong>
                </div>

            </div>

        `;

        container.appendChild(card);

        updateMenuRow(
            card.querySelector(".menu-servings")
        );

    });

}


function updateMenuRow(element) {

    const card =
        element.closest(".menu-card");

    if (!card) {
        return;
    }

    const recipeId =
        Number(card.dataset.recipeId);

    const recipe =
        savedRecipes.find(
            item => item.id === recipeId
        );

    if (!recipe) {
        return;
    }

    const servings =
        Number(
            card.querySelector(".menu-servings").value
        );

    const price =
        Number(
            card.querySelector(".menu-price").value
        );

    const costServing =
        servings > 0
            ? recipe.totalCost / servings
            : 0;

    const profitServing =
        price - costServing;

    const totalProfit =
        servings * profitServing;

    card.querySelector(".menu-cost-serving")
        .textContent =
        formatMoney(costServing);

    card.querySelector(".menu-profit-serving")
        .textContent =
        formatMoney(profitServing);

    card.querySelector(".menu-total-profit")
        .textContent =
        formatMoney(totalProfit);

    calculateMenuTotals();
}


function calculateMenuTotals() {

    const cards =
        document.querySelectorAll(".menu-card");

    if (cards.length === 0) {

        document.getElementById(
            "menuTotalsContainer"
        ).innerHTML = "";

        return;
    }

    let totalServings = 0;
    let totalSales = 0;
    let totalFoodCost = 0;
    let totalProfit = 0;

    cards.forEach(card => {

        const recipeId =
            Number(card.dataset.recipeId);

        const recipe =
            savedRecipes.find(
                item => item.id === recipeId
            );

        if (!recipe) {
            return;
        }

        const servings =
            Number(
                card.querySelector(".menu-servings").value
            );

        const price =
            Number(
                card.querySelector(".menu-price").value
            );

        if (
            servings > 0 &&
            price >= 0
        ) {

            totalServings += servings;

            totalSales +=
                price * servings;

            totalFoodCost +=
                recipe.totalCost;

            totalProfit +=
                (price * servings) -
                recipe.totalCost;
        }

    });

    document.getElementById(
        "menuTotalsContainer"
    ).innerHTML = `

        <div class="card">

            <h3 class="card-title">
                Daily Menu Summary
            </h3>

            <div class="summary-grid">

                <div class="summary-item">
                    <div class="summary-item-label">
                        Total Servings
                    </div>

                    <div class="summary-item-value">
                        ${totalServings}
                    </div>
                </div>


                <div class="summary-item">
                    <div class="summary-item-label">
                        Expected Sales
                    </div>

                    <div class="summary-item-value">
                        ${formatMoney(totalSales)}
                    </div>
                </div>


                <div class="summary-item">
                    <div class="summary-item-label">
                        Total Food Cost
                    </div>

                    <div class="summary-item-value">
                        ${formatMoney(totalFoodCost)}
                    </div>
                </div>


                <div class="summary-item profit">
                    <div class="summary-item-label">
                        Expected Profit
                    </div>

                    <div class="summary-item-value">
                        ${formatMoney(totalProfit)}
                    </div>
                </div>

            </div>

            <button
                class="success-button"
                style="margin-top:14px;"
                onclick="saveDailyMenu()"
            >
                Save Menu of the Day
            </button>

        </div>

    `;

}


function saveDailyMenu() {

    const date =
        document.getElementById("menuDate").value;

    if (!date) {
        alert("Please select a date.");
        return;
    }

    const cards =
        document.querySelectorAll(".menu-card");

    if (cards.length === 0) {
        alert("There are no recipes for this date.");
        return;
    }

    const items = [];

    cards.forEach(card => {

        const recipeId =
            Number(card.dataset.recipeId);

        const servings =
            Number(
                card.querySelector(".menu-servings").value
            );

        const sellingPrice =
            Number(
                card.querySelector(".menu-price").value
            );

        items.push({

            recipeId: recipeId,

            servings: servings,

            sellingPrice: sellingPrice

        });

    });

    const existingIndex =
        savedMenus.findIndex(
            menu => menu.date === date
        );

    const menu = {

        id:
            existingIndex >= 0
                ? savedMenus[existingIndex].id
                : Date.now(),

        date: date,

        items: items

    };

    if (existingIndex >= 0) {

        savedMenus[existingIndex] = menu;

    } else {

        savedMenus.push(menu);

    }

    localStorage.setItem(
        "savedMenus",
        JSON.stringify(savedMenus)
    );

    alert("Menu of the Day saved successfully.");

}


/* =========================================================
   INGREDIENT PRICES
========================================================= */

function saveIngredientPrice() {

    const name =
        document
            .getElementById("priceIngredientName")
            .value
            .trim();

    const price =
        Number(
            document.getElementById(
                "priceIngredientPrice"
            ).value
        );

    const quantity =
        Number(
            document.getElementById(
                "priceIngredientQuantity"
            ).value
        );

    const unit =
        document.getElementById(
            "priceIngredientUnit"
        ).value;

    if (!name) {
        alert("Please enter the ingredient name.");
        return;
    }

    if (!price || price <= 0) {
        alert("Please enter a valid price.");
        return;
    }

    if (!quantity || quantity <= 0) {
        alert("Please enter a valid quantity.");
        return;
    }

    const existingIndex =
        ingredientPrices.findIndex(
            item =>
                item.name.toLowerCase() ===
                name.toLowerCase()
        );

    if (existingIndex >= 0) {

        showConfirm(
            "Ingredient Already Exists",
            "This ingredient already has a saved price. Replace it?",
            function () {

                ingredientPrices[existingIndex] = {

                    ...ingredientPrices[existingIndex],

                    name: name,

                    price: price,

                    quantity: quantity,

                    unit: unit

                };

                saveIngredientPricesToStorage();

                clearIngredientPriceForm();

                alert("Ingredient price updated.");

            }
        );

        return;
    }

    ingredientPrices.push({

        id: Date.now(),

        name: name,

        price: price,

        quantity: quantity,

        unit: unit

    });

    saveIngredientPricesToStorage();

    clearIngredientPriceForm();

    alert("Ingredient price saved.");

}


function saveIngredientPricesToStorage() {

    localStorage.setItem(
        "ingredientPrices",
        JSON.stringify(ingredientPrices)
    );

}


function clearIngredientPriceForm() {

    document.getElementById(
        "priceIngredientName"
    ).value = "";

    document.getElementById(
        "priceIngredientPrice"
    ).value = "";

    document.getElementById(
        "priceIngredientQuantity"
    ).value = "";

    document.getElementById(
        "priceIngredientUnit"
    ).value = "kg";

    renderIngredientPrices();

}


function renderIngredientPrices() {

    const container =
        document.getElementById(
            "ingredientPriceList"
        );

    container.innerHTML = "";

    if (ingredientPrices.length === 0) {

        container.innerHTML = `
            <div class="empty-message">
                No ingredient prices saved yet.
            </div>
        `;

        return;
    }

    ingredientPrices.forEach(item => {

        const card =
            document.createElement("div");

        card.className = "record-card";

        const unitLabel =
            unitDefinitions[item.unit]?.label ||
            item.unit;

        card.innerHTML = `

            <div class="record-title">
                ${escapeHtml(item.name)}
            </div>

            <div class="record-info">
                ${formatMoney(item.price)}
                /
                ${item.quantity}
                ${unitLabel}
            </div>

            <button
                class="record-delete"
                onclick="deleteIngredientPrice(${item.id})"
            >
                Delete
            </button>

        `;

        container.appendChild(card);

    });

}


function deleteIngredientPrice(id) {

    showConfirm(
        "Delete Ingredient",
        "Delete this ingredient price?",
        function () {

            ingredientPrices =
                ingredientPrices.filter(
                    item => item.id !== id
                );

            saveIngredientPricesToStorage();

            renderIngredientPrices();

        }
    );

}


/* =========================================================
   DAILY SALES
========================================================= */

function initializeSalesScreen() {

    const dateInput =
        document.getElementById("salesDate");

    if (!dateInput.value) {
        dateInput.value = getLocalDateString();
    }

    if (
        document.getElementById("salesContainer")
            .children.length === 0
    ) {
        addSalesRow();
    }

    if (
        document.getElementById("expenseContainer")
            .children.length === 0
    ) {
        addExpenseRow();
    }

}


function addSalesRow() {

    const container =
        document.getElementById("salesContainer");

    const row =
        document.createElement("div");

    row.className = "sales-row";

    row.innerHTML = `

        <div class="sales-grid">

            <input
                type="text"
                class="sale-item"
                placeholder="Item"
            >

            <input
                type="number"
                class="sale-qty"
                inputmode="numeric"
                min="0"
                placeholder="Qty"
            >

        </div>

        <div class="sales-price-grid">

            <input
                type="number"
                class="sale-price"
                inputmode="decimal"
                min="0"
                step="any"
                placeholder="Price"
            >

            <button
                class="remove-small-button"
                onclick="this.closest('.sales-row').remove()"
            >
                ×
            </button>

        </div>

    `;

    container.appendChild(row);

}


function addExpenseRow() {

    const container =
        document.getElementById(
            "expenseContainer"
        );

    const row =
        document.createElement("div");

    row.className = "expense-row";

    row.innerHTML = `

        <div class="expense-grid">

            <input
                type="text"
                class="expense-name"
                placeholder="Expense"
            >

            <input
                type="number"
                class="expense-amount"
                inputmode="decimal"
                min="0"
                step="any"
                placeholder="Amount"
            >

        </div>

        <div style="text-align:right;margin-top:8px;">

            <button
                class="remove-small-button"
                onclick="this.closest('.expense-row').remove()"
            >
                ×
            </button>

        </div>

    `;

    container.appendChild(row);

}


function calculateDailySales() {

    let totalSales = 0;

    document
        .querySelectorAll(".sales-row")
        .forEach(row => {

            const qty =
                Number(
                    row.querySelector(".sale-qty").value
                );

            const price =
                Number(
                    row.querySelector(".sale-price").value
                );

            totalSales += qty * price;

        });


    let totalExpenses = 0;

    document
        .querySelectorAll(".expense-row")
        .forEach(row => {

            totalExpenses +=
                Number(
                    row.querySelector(
                        ".expense-amount"
                    ).value
                ) || 0;

        });


    const profit =
        totalSales - totalExpenses;


    document.getElementById(
        "dailySalesResult"
    ).innerHTML = `

        <div class="card" style="margin-top:14px;">

            <h3 class="card-title">
                Daily Result
            </h3>

            <div class="summary-grid">

                <div class="summary-item">
                    <div class="summary-item-label">
                        Sales
                    </div>

                    <div class="summary-item-value">
                        ${formatMoney(totalSales)}
                    </div>
                </div>


                <div class="summary-item">
                    <div class="summary-item-label">
                        Expenses
                    </div>

                    <div class="summary-item-value">
                        ${formatMoney(totalExpenses)}
                    </div>
                </div>


                <div class="summary-item profit">
                    <div class="summary-item-label">
                        Profit
                    </div>

                    <div class="summary-item-value">
                        ${formatMoney(profit)}
                    </div>
                </div>

            </div>

        </div>

    `;

    return {
        totalSales,
        totalExpenses,
        profit
    };

}


function saveDailySales() {

    const date =
        document.getElementById("salesDate").value;

    if (!date) {
        alert("Please select a date.");
        return;
    }

    const result =
        calculateDailySales();

    const sales = [];

    document
        .querySelectorAll(".sales-row")
        .forEach(row => {

            const item =
                row.querySelector(".sale-item")
                    .value
                    .trim();

            const qty =
                Number(
                    row.querySelector(".sale-qty").value
                );

            const price =
                Number(
                    row.querySelector(".sale-price").value
                );

            if (item && qty > 0) {

                sales.push({
                    item,
                    qty,
                    price
                });

            }

        });


    const expenses = [];

    document
        .querySelectorAll(".expense-row")
        .forEach(row => {

            const name =
                row.querySelector(".expense-name")
                    .value
                    .trim();

            const amount =
                Number(
                    row.querySelector(
                        ".expense-amount"
                    ).value
                );

            if (name && amount > 0) {

                expenses.push({
                    name,
                    amount
                });

            }

        });


    const record = {

        id: Date.now(),

        date,

        sales,

        expenses,

        totalSales:
            result.totalSales,

        totalExpenses:
            result.totalExpenses,

        profit:
            result.profit

    };


    const existingIndex =
        dailySalesRecords.findIndex(
            item => item.date === date
        );


    if (existingIndex >= 0) {

        showConfirm(
            "Record Already Exists",
            "A daily sales record already exists for this date. Replace it?",
            function () {

                dailySalesRecords[
                    existingIndex
                ] = record;

                localStorage.setItem(
                    "dailySalesRecords",
                    JSON.stringify(
                        dailySalesRecords
                    )
                );

                updateTodaySummary();

                alert("Daily record updated.");

            }
        );

        return;
    }


    dailySalesRecords.push(record);

    localStorage.setItem(
        "dailySalesRecords",
        JSON.stringify(
            dailySalesRecords
        )
    );

    updateTodaySummary();

    alert("Daily sales record saved.");

}


/* =========================================================
   PROFIT CALCULATOR
========================================================= */

function calculateProfit() {

    const sales =
        Number(
            document.getElementById(
                "profitSales"
            ).value
        ) || 0;

    const foodCost =
        Number(
            document.getElementById(
                "profitFoodCost"
            ).value
        ) || 0;

    const labor =
        Number(
            document.getElementById(
                "profitLabor"
            ).value
        ) || 0;

    const rent =
        Number(
            document.getElementById(
                "profitRent"
            ).value
        ) || 0;

    const other =
        Number(
            document.getElementById(
                "profitOther"
            ).value
        ) || 0;


    const totalExpenses =
        foodCost +
        labor +
        rent +
        other;


    const netProfit =
        sales - totalExpenses;


    document.getElementById(
        "profitResult"
    ).innerHTML = `

        <div class="card">

            <h3 class="card-title">
                Result
            </h3>

            <div class="summary-grid">

                <div class="summary-item">
                    <div class="summary-item-label">
                        Sales
                    </div>

                    <div class="summary-item-value">
                        ${formatMoney(sales)}
                    </div>
                </div>


                <div class="summary-item">
                    <div class="summary-item-label">
                        Total Expenses
                    </div>

                    <div class="summary-item-value">
                        ${formatMoney(totalExpenses)}
                    </div>
                </div>


                <div class="summary-item profit">
                    <div class="summary-item-label">
                        Net Profit
                    </div>

                    <div class="summary-item-value">
                        ${formatMoney(netProfit)}
                    </div>
                </div>

            </div>

        </div>

    `;

}


/* =========================================================
   SAVED RECORDS
========================================================= */

function renderSavedRecords() {

    renderSavedRecipes();

    renderSavedMenus();

    renderSavedSales();

}


function renderSavedRecipes() {

    const container =
        document.getElementById(
            "savedRecipesList"
        );

    container.innerHTML = "";

    if (savedRecipes.length === 0) {

        container.innerHTML = `
            <div class="empty-message">
                No saved recipes.
            </div>
        `;

        return;
    }


    savedRecipes
        .slice()
        .reverse()
        .forEach(recipe => {

            const card =
                document.createElement("div");

            card.className = "record-card";

            card.innerHTML = `

                <div class="record-title">
                    ${escapeHtml(recipe.name)}
                </div>

                <div class="record-info">
                    ${recipe.date}
                </div>

                <div class="record-info">
                    Total Cost:
                    <strong>
                        ${formatMoney(recipe.totalCost)}
                    </strong>
                </div>

                <button
                    class="record-delete"
                    onclick="deleteRecipe(${recipe.id})"
                >
                    Delete
                </button>

            `;

            container.appendChild(card);

        });

}


function renderSavedMenus() {

    const container =
        document.getElementById(
            "savedMenusList"
        );

    container.innerHTML = "";

    if (savedMenus.length === 0) {

        container.innerHTML = `
            <div class="empty-message">
                No saved menus.
            </div>
        `;

        return;
    }


    savedMenus
        .slice()
        .reverse()
        .forEach(menu => {

            const card =
                document.createElement("div");

            card.className = "record-card";

            card.innerHTML = `

                <div class="record-title">
                    Menu of the Day
                </div>

                <div class="record-info">
                    ${menu.date}
                </div>

                <div class="record-info">
                    ${menu.items.length} menu item(s)
                </div>

                <button
                    class="record-delete"
                    onclick="deleteMenu(${menu.id})"
                >
                    Delete
                </button>

            `;

            container.appendChild(card);

        });

}


function renderSavedSales() {

    const container =
        document.getElementById(
            "savedSalesList"
        );

    container.innerHTML = "";

    if (dailySalesRecords.length === 0) {

        container.innerHTML = `
            <div class="empty-message">
                No daily sales records.
            </div>
        `;

        return;
    }


    dailySalesRecords
        .slice()
        .reverse()
        .forEach(record => {

            const card =
                document.createElement("div");

            card.className = "record-card";

            card.innerHTML = `

                <div class="record-title">
                    ${record.date}
                </div>

                <div class="record-info">
                    Sales:
                    ${formatMoney(record.totalSales)}
                </div>

                <div class="record-info">
                    Expenses:
                    ${formatMoney(record.totalExpenses)}
                </div>

                <div class="record-info">
                    Profit:
                    <strong style="color:#16834b;">
                        ${formatMoney(record.profit)}
                    </strong>
                </div>

                <button
                    class="record-delete"
                    onclick="deleteSalesRecord(${record.id})"
                >
                    Delete
                </button>

            `;

            container.appendChild(card);

        });

}


/* =========================================================
   DELETE RECORDS
========================================================= */

function deleteRecipe(id) {

    showConfirm(
        "Delete Recipe",
        "Delete this saved recipe?",
        function () {

            savedRecipes =
                savedRecipes.filter(
                    recipe => recipe.id !== id
                );

            localStorage.setItem(
                "savedRecipes",
                JSON.stringify(savedRecipes)
            );

            renderSavedRecords();

        }
    );

}


function deleteMenu(id) {

    showConfirm(
        "Delete Menu",
        "Delete this saved menu?",
        function () {

            savedMenus =
                savedMenus.filter(
                    menu => menu.id !== id
                );

            localStorage.setItem(
                "savedMenus",
                JSON.stringify(savedMenus)
            );

            renderSavedRecords();

        }
    );

}


function deleteSalesRecord(id) {

    showConfirm(
        "Delete Sales Record",
        "Delete this daily sales record?",
        function () {

            dailySalesRecords =
                dailySalesRecords.filter(
                    record => record.id !== id
                );

            localStorage.setItem(
                "dailySalesRecords",
                JSON.stringify(
                    dailySalesRecords
                )
            );

            renderSavedRecords();

            updateTodaySummary();

        }
    );

}


/* =========================================================
   TODAY'S SUMMARY
========================================================= */

function updateTodaySummary() {

    const today =
        getLocalDateString();

    const records =
        dailySalesRecords.filter(
            record => record.date === today
        );


    let sales = 0;
    let expenses = 0;
    let profit = 0;


    records.forEach(record => {

        sales += Number(record.totalSales) || 0;

        expenses +=
            Number(record.totalExpenses) || 0;

        profit +=
            Number(record.profit) || 0;

    });


    document.getElementById(
        "todaySales"
    ).textContent =
        formatMoney(sales);


    document.getElementById(
        "todayExpenses"
    ).textContent =
        formatMoney(expenses);


    document.getElementById(
        "todayProfit"
    ).textContent =
        formatMoney(profit);

}


/* =========================================================
   HTML SAFETY
========================================================= */

function escapeHtml(text) {

    const div =
        document.createElement("div");

    div.textContent = text;

    return div.innerHTML;

}


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        const today =
            getLocalDateString();

        document.getElementById(
            "recipeDate"
        ).value = today;

        document.getElementById(
            "menuDate"
        ).value = today;

        document.getElementById(
            "salesDate"
        ).value = today;


        updateTodaySummary();

    }
);
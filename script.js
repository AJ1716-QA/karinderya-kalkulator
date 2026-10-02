/* =========================================================
   KARINDERYA KALKULATOR
   CORRECTED VERSION
   Matches current index.html
========================================================= */


/* =========================================================
   LOCAL STORAGE
========================================================= */

let savedRecipes =
    JSON.parse(localStorage.getItem("savedRecipes")) || [];

let savedMenus =
    JSON.parse(localStorage.getItem("savedMenus")) || [];

let ingredientPrices =
    JSON.parse(localStorage.getItem("ingredientPrices")) || [];

let dailySalesRecords =
    JSON.parse(localStorage.getItem("dailySalesRecords")) || [];


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
   UNITS
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


function canConvertUnits(fromUnit, toUnit) {

    if (!unitDefinitions[fromUnit] || !unitDefinitions[toUnit]) {
        return false;
    }

    return (
        unitDefinitions[fromUnit].type ===
        unitDefinitions[toUnit].type
    );
}


function convertUnit(quantity, fromUnit, toUnit) {

    if (!canConvertUnits(fromUnit, toUnit)) {
        return null;
    }

    const from = unitDefinitions[fromUnit];
    const to = unitDefinitions[toUnit];

    const baseQuantity =
        Number(quantity) * from.multiplier;

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

    const purchaseInRecipeUnit =
        convertUnit(
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

    const screen =
        document.getElementById(screenId);

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

    if (screenId === "ingredientScreen") {
        renderIngredientPrices();
    }

    if (screenId === "recordsScreen") {
        renderSavedRecords();
    }

    if (screenId === "homeScreen") {
        updateTodaySummary();
    }
}


function leaveScreen(currentScreen, targetScreen) {
    showScreen(targetScreen);
}


/* =========================================================
   MODAL
========================================================= */

let modalConfirmCallback = null;


function showConfirm(title, message, callback) {

    document.getElementById("modalTitle").textContent =
        title;

    document.getElementById("modalMessage").textContent =
        message;

    modalConfirmCallback = callback;

    document
        .getElementById("confirmModal")
        .classList.add("show");
}


function closeConfirmModal() {

    document
        .getElementById("confirmModal")
        .classList.remove("show");

    modalConfirmCallback = null;
}


function modalYes() {

    if (typeof modalConfirmCallback === "function") {
        modalConfirmCallback();
    }

    closeConfirmModal();
}


function modalNo() {
    closeConfirmModal();
}


function modalCancel() {
    closeConfirmModal();
}


/* =========================================================
   RECIPE COST
========================================================= */

function initializeRecipeScreen() {

    const dateInput =
        document.getElementById("recipeDate");

    if (!dateInput.value) {
        dateInput.value =
            getLocalDateString();
    }

    const container =
        document.getElementById("recipeIngredients");

    if (
        container &&
        container.children.length === 0
    ) {
        addRecipeIngredient();
    }

    calculateRecipeTotal();
}


/* Main function used by HTML button */
function addRecipeIngredient() {

    const container =
        document.getElementById("recipeIngredients");

    if (!container) {
        return;
    }

    const row =
        document.createElement("tr");

    row.className = "recipe-ingredient-row";

    row.innerHTML = `

        <td>
            <select
                class="recipe-ingredient"
                onchange="calculateRecipeRow(this)"
            >
                <option value="">
                    Select ingredient
                </option>
            </select>
        </td>

        <td>
            <input
                type="number"
                class="recipe-amount"
                inputmode="decimal"
                min="0"
                step="any"
                placeholder="Amount"
                oninput="calculateRecipeRow(this)"
            >
        </td>

        <td>
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
        </td>

        <td class="cost-cell">
            <span class="row-cost">₱0.00</span>
        </td>

        <td>
            <button
                type="button"
                class="remove-row"
                onclick="removeRecipeIngredient(this)"
            >
                ×
            </button>
        </td>

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

        const option =
            document.createElement("option");

        option.value = item.id;

        option.textContent =
            `${item.name} — ${formatMoney(item.price)} / ${item.quantity} ${unitDefinitions[item.unit]?.label || item.unit}`;

        select.appendChild(option);
    });
}


function removeRecipeIngredient(button) {

    const row =
        button.closest(".recipe-ingredient-row");

    if (row) {
        row.remove();
    }

    calculateRecipeTotal();
}


function calculateRecipeRow(element) {

    const row =
        element.closest(".recipe-ingredient-row");

    if (!row) {
        return;
    }

    const ingredientId =
        row.querySelector(".recipe-ingredient").value;

    const amount =
        Number(
            row.querySelector(".recipe-amount").value
        );

    const unit =
        row.querySelector(".recipe-unit").value;

    const costDisplay =
        row.querySelector(".row-cost");

    const ingredient =
        ingredientPrices.find(
            item =>
                String(item.id) ===
                String(ingredientId)
        );

    if (
        !ingredient ||
        !amount ||
        amount <= 0
    ) {

        costDisplay.textContent =
            "₱0.00";

        calculateRecipeTotal();

        return;
    }

    const cost =
        calculateIngredientCost(
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
        .querySelectorAll(".recipe-ingredient-row")
        .forEach(row => {

            const ingredientId =
                row.querySelector(
                    ".recipe-ingredient"
                ).value;

            const amount =
                Number(
                    row.querySelector(
                        ".recipe-amount"
                    ).value
                );

            const unit =
                row.querySelector(
                    ".recipe-unit"
                ).value;

            const ingredient =
                ingredientPrices.find(
                    item =>
                        String(item.id) ===
                        String(ingredientId)
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

    document.getElementById(
        "recipeTotalCost"
    ).textContent =
        formatMoney(total);

    return total;
}


function saveRecipe() {

    const date =
        document.getElementById(
            "recipeDate"
        ).value;

    const name =
        document.getElementById(
            "recipeName"
        ).value.trim();

    if (!date) {
        alert(
            "Please select the recipe date."
        );
        return;
    }

    if (!name) {
        alert(
            "Please enter the recipe name."
        );
        return;
    }

    const rows =
        document.querySelectorAll(
            ".recipe-ingredient-row"
        );

    const ingredients = [];

    rows.forEach(row => {

        const ingredientId =
            row.querySelector(
                ".recipe-ingredient"
            ).value;

        const amount =
            Number(
                row.querySelector(
                    ".recipe-amount"
                ).value
            );

        const unit =
            row.querySelector(
                ".recipe-unit"
            ).value;

        const ingredient =
            ingredientPrices.find(
                item =>
                    String(item.id) ===
                    String(ingredientId)
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
                    ingredientId:
                        ingredient.id,

                    ingredientName:
                        ingredient.name,

                    amount:
                        amount,

                    unit:
                        unit,

                    cost:
                        cost
                });
            }
        }

    });

    if (ingredients.length === 0) {

        alert(
            "Please add at least one valid ingredient."
        );

        return;
    }

    const totalCost =
        ingredients.reduce(
            (sum, item) =>
                sum + Number(item.cost),
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

    document.getElementById(
        "recipeName"
    ).value = "";

    document.getElementById(
        "recipeIngredients"
    ).innerHTML = "";

    addRecipeIngredient();

    calculateRecipeTotal();
}


/* =========================================================
   MENU OF THE DAY
========================================================= */

function initializeMenuScreen() {

    const dateInput =
        document.getElementById(
            "menuDate"
        );

    if (!dateInput.value) {
        dateInput.value =
            getLocalDateString();
    }

    loadMenuOfDay();
}


function getRecipesForDate(date) {

    return savedRecipes.filter(
        recipe =>
            recipe.date === date
    );
}


function getSavedMenu(date) {

    return savedMenus.find(
        menu =>
            menu.date === date
    );
}


function loadMenuOfDay() {

    const date =
        document.getElementById(
            "menuDate"
        ).value;

    const tableContainer =
        document.getElementById(
            "menuTableContainer"
        );

    const totals =
        document.getElementById(
            "menuTotals"
        );

    const message =
        document.getElementById(
            "noRecipesMessage"
        );

    const itemsContainer =
        document.getElementById(
            "menuItems"
        );

    itemsContainer.innerHTML = "";

    tableContainer.classList.add("hidden");
    totals.classList.add("hidden");
    message.classList.add("hidden");

    if (!date) {
        return;
    }

    const recipes =
        getRecipesForDate(date);

    if (recipes.length === 0) {

        message.classList.remove(
            "hidden"
        );

        return;
    }

    tableContainer.classList.remove(
        "hidden"
    );

    totals.classList.remove(
        "hidden"
    );

    const savedMenu =
        getSavedMenu(date);

    recipes.forEach(recipe => {

        const savedItem =
            savedMenu?.items?.find(
                item =>
                    Number(item.recipeId) ===
                    Number(recipe.id)
            );

        const servings =
            savedItem?.servings || "";

        const sellingPrice =
            savedItem?.sellingPrice || "";

        const row =
            document.createElement("tr");

        row.className =
            "menu-item-row";

        row.dataset.recipeId =
            recipe.id;

        row.innerHTML = `

            <td class="menu-name">
                ${escapeHtml(recipe.name)}
            </td>

            <td class="menu-cost">
                ${formatMoney(recipe.totalCost)}
            </td>

            <td>
                <input
                    type="number"
                    class="menu-input menu-servings"
                    inputmode="numeric"
                    min="1"
                    value="${servings}"
                    placeholder="20"
                    oninput="updateMenuRow(this)"
                >
            </td>

            <td>
                <input
                    type="number"
                    class="menu-input menu-price"
                    inputmode="decimal"
                    min="0"
                    step="any"
                    value="${sellingPrice}"
                    placeholder="40"
                    oninput="updateMenuRow(this)"
                >
            </td>

            <td class="auto-value menu-cost-serving">
                ₱0.00
            </td>

            <td class="profit-cell menu-profit-serving">
                ₱0.00
            </td>

            <td class="profit-cell menu-total-profit">
                ₱0.00
            </td>

        `;

        itemsContainer.appendChild(row);

        updateMenuRow(
            row.querySelector(
                ".menu-servings"
            )
        );

    });

    calculateMenuTotals();
}


function updateMenuRow(element) {

    const row =
        element.closest(
            ".menu-item-row"
        );

    if (!row) {
        return;
    }

    const recipeId =
        Number(row.dataset.recipeId);

    const recipe =
        savedRecipes.find(
            item =>
                Number(item.id) ===
                recipeId
        );

    if (!recipe) {
        return;
    }

    const servings =
        Number(
            row.querySelector(
                ".menu-servings"
            ).value
        );

    const price =
        Number(
            row.querySelector(
                ".menu-price"
            ).value
        );

    const costServing =
        servings > 0
            ? recipe.totalCost / servings
            : 0;

    const profitServing =
        price - costServing;

    const totalProfit =
        servings * profitServing;

    row.querySelector(
        ".menu-cost-serving"
    ).textContent =
        formatMoney(costServing);

    row.querySelector(
        ".menu-profit-serving"
    ).textContent =
        formatMoney(profitServing);

    row.querySelector(
        ".menu-total-profit"
    ).textContent =
        formatMoney(totalProfit);

    calculateMenuTotals();
}


function calculateMenuTotals() {

    const rows =
        document.querySelectorAll(
            ".menu-item-row"
        );

    let totalServings = 0;
    let totalSales = 0;
    let totalFoodCost = 0;
    let totalProfit = 0;

    rows.forEach(row => {

        const recipeId =
            Number(row.dataset.recipeId);

        const recipe =
            savedRecipes.find(
                item =>
                    Number(item.id) ===
                    recipeId
            );

        if (!recipe) {
            return;
        }

        const servings =
            Number(
                row.querySelector(
                    ".menu-servings"
                ).value
            );

        const price =
            Number(
                row.querySelector(
                    ".menu-price"
                ).value
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
        "menuTotalServings"
    ).textContent =
        totalServings;

    document.getElementById(
        "menuTotalSales"
    ).textContent =
        formatMoney(totalSales);

    document.getElementById(
        "menuTotalFoodCost"
    ).textContent =
        formatMoney(totalFoodCost);

    document.getElementById(
        "menuTotalProfit"
    ).textContent =
        formatMoney(totalProfit);
}


function saveDailyMenu() {

    const date =
        document.getElementById(
            "menuDate"
        ).value;

    if (!date) {
        alert(
            "Please select a date."
        );
        return;
    }

    const rows =
        document.querySelectorAll(
            ".menu-item-row"
        );

    if (rows.length === 0) {
        alert(
            "There are no recipes for this date."
        );
        return;
    }

    const items = [];

    rows.forEach(row => {

        items.push({

            recipeId:
                Number(row.dataset.recipeId),

            servings:
                Number(
                    row.querySelector(
                        ".menu-servings"
                    ).value
                ) || 0,

            sellingPrice:
                Number(
                    row.querySelector(
                        ".menu-price"
                    ).value
                ) || 0

        });

    });

    const existingIndex =
        savedMenus.findIndex(
            menu =>
                menu.date === date
        );

    const menu = {

        id:
            existingIndex >= 0
                ? savedMenus[
                    existingIndex
                  ].id
                : Date.now(),

        date: date,

        items: items

    };

    if (existingIndex >= 0) {

        savedMenus[
            existingIndex
        ] = menu;

    } else {

        savedMenus.push(menu);

    }

    localStorage.setItem(
        "savedMenus",
        JSON.stringify(savedMenus)
    );

    alert(
        "Menu of the Day saved successfully."
    );
}


/* =========================================================
   INGREDIENT PRICES
========================================================= */

function saveIngredientPrice() {

    const name =
        document.getElementById(
            "ingredientName"
        ).value.trim();

    const price =
        Number(
            document.getElementById(
                "ingredientPrice"
            ).value
        );

    const quantity =
        Number(
            document.getElementById(
                "ingredientQuantity"
            ).value
        );

    const unit =
        document.getElementById(
            "ingredientUnit"
        ).value;

    if (!name) {
        alert(
            "Please enter the ingredient name."
        );
        return;
    }

    if (!price || price <= 0) {
        alert(
            "Please enter a valid price."
        );
        return;
    }

    if (!quantity || quantity <= 0) {
        alert(
            "Please enter a valid quantity."
        );
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

                ingredientPrices[
                    existingIndex
                ] = {

                    ...ingredientPrices[
                        existingIndex
                    ],

                    name:
                        name,

                    price:
                        price,

                    quantity:
                        quantity,

                    unit:
                        unit

                };

                saveIngredientPricesToStorage();

                clearIngredientPriceForm();

                alert(
                    "Ingredient price updated."
                );

            }
        );

        return;
    }

    ingredientPrices.push({

        id:
            Date.now(),

        name:
            name,

        price:
            price,

        quantity:
            quantity,

        unit:
            unit

    });

    saveIngredientPricesToStorage();

    clearIngredientPriceForm();

    alert(
        "Ingredient price saved."
    );
}


function saveIngredientPricesToStorage() {

    localStorage.setItem(
        "ingredientPrices",
        JSON.stringify(
            ingredientPrices
        )
    );
}


function clearIngredientPriceForm() {

    document.getElementById(
        "ingredientName"
    ).value = "";

    document.getElementById(
        "ingredientPrice"
    ).value = "";

    document.getElementById(
        "ingredientQuantity"
    ).value = "";

    document.getElementById(
        "ingredientUnit"
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
            document.createElement(
                "div"
            );

        card.className =
            "record-card";

        const unitLabel =
            unitDefinitions[
                item.unit
            ]?.label ||
            item.unit;

        card.innerHTML = `

            <div>

                <div class="record-name">
                    ${escapeHtml(item.name)}
                </div>

                <div class="record-info">
                    ${formatMoney(item.price)}
                    /
                    ${item.quantity}
                    ${unitLabel}
                </div>

            </div>

            <button
                class="danger-button"
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
                    item =>
                        item.id !== id
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
        document.getElementById(
            "salesDate"
        );

    if (!dateInput.value) {
        dateInput.value =
            getLocalDateString();
    }

    const container =
        document.getElementById(
            "salesRows"
        );

    if (
        container &&
        container.children.length === 0
    ) {
        addSalesRow();
    }

    const expenseContainer =
        document.getElementById(
            "expenseRows"
        );

    if (
        expenseContainer &&
        expenseContainer.children.length === 0
    ) {
        addExpenseRow();
    }
}


function addSalesRow() {

    const container =
        document.getElementById(
            "salesRows"
        );

    if (!container) {
        return;
    }

    const row =
        document.createElement(
            "tr"
        );

    row.className =
        "sales-row";

    row.innerHTML = `

        <td>
            <input
                type="text"
                class="sale-item"
                placeholder="Item"
            >
        </td>

        <td>
            <input
                type="number"
                class="sale-qty"
                inputmode="numeric"
                min="0"
                placeholder="Qty"
            >
        </td>

        <td>
            <input
                type="number"
                class="sale-price"
                inputmode="decimal"
                min="0"
                step="any"
                placeholder="Price"
            >
        </td>

        <td class="cost-cell sale-total">
            ₱0.00
        </td>

        <td>
            <button
                type="button"
                class="remove-row"
                onclick="removeSalesRow(this)"
            >
                ×
            </button>
        </td>

    `;

    container.appendChild(row);

    row.querySelector(".sale-qty")
        .addEventListener(
            "input",
            calculateSaleRow
        );

    row.querySelector(".sale-price")
        .addEventListener(
            "input",
            calculateSaleRow
        );
}


function calculateSaleRow(event) {

    const row =
        event.target.closest(
            ".sales-row"
        );

    if (!row) {
        return;
    }

    const qty =
        Number(
            row.querySelector(
                ".sale-qty"
            ).value
        ) || 0;

    const price =
        Number(
            row.querySelector(
                ".sale-price"
            ).value
        ) || 0;

    row.querySelector(
        ".sale-total"
    ).textContent =
        formatMoney(
            qty * price
        );
}


function removeSalesRow(button) {

    const row =
        button.closest(
            ".sales-row"
        );

    if (row) {
        row.remove();
    }
}


function addExpenseRow() {

    const container =
        document.getElementById(
            "expenseRows"
        );

    if (!container) {
        return;
    }

    const row =
        document.createElement(
            "tr"
        );

    row.className =
        "expense-row";

    row.innerHTML = `

        <td>
            <input
                type="text"
                class="expense-name"
                placeholder="Expense"
            >
        </td>

        <td>
            <input
                type="number"
                class="expense-amount"
                inputmode="decimal"
                min="0"
                step="any"
                placeholder="Amount"
            >
        </td>

        <td>
            <button
                type="button"
                class="remove-row"
                onclick="removeExpenseRow(this)"
            >
                ×
            </button>
        </td>

    `;

    container.appendChild(row);
}


function removeExpenseRow(button) {

    const row =
        button.closest(
            ".expense-row"
        );

    if (row) {
        row.remove();
    }
}


function calculateDailySales() {

    let totalSales = 0;

    document
        .querySelectorAll(
            ".sales-row"
        )
        .forEach(row => {

            const qty =
                Number(
                    row.querySelector(
                        ".sale-qty"
                    ).value
                ) || 0;

            const price =
                Number(
                    row.querySelector(
                        ".sale-price"
                    ).value
                ) || 0;

            totalSales +=
                qty * price;
        });

    let totalExpenses = 0;

    document
        .querySelectorAll(
            ".expense-row"
        )
        .forEach(row => {

            totalExpenses +=
                Number(
                    row.querySelector(
                        ".expense-amount"
                    ).value
                ) || 0;
        });

    const profit =
        totalSales -
        totalExpenses;

    document.getElementById(
        "dailyTotalSales"
    ).textContent =
        formatMoney(totalSales);

    document.getElementById(
        "dailyTotalExpenses"
    ).textContent =
        formatMoney(totalExpenses);

    document.getElementById(
        "dailyProfit"
    ).textContent =
        formatMoney(profit);

    return {
        totalSales,
        totalExpenses,
        profit
    };
}


function saveDailySales() {

    const date =
        document.getElementById(
            "salesDate"
        ).value;

    if (!date) {
        alert(
            "Please select a date."
        );
        return;
    }

    const result =
        calculateDailySales();

    const sales = [];

    document
        .querySelectorAll(
            ".sales-row"
        )
        .forEach(row => {

            const item =
                row.querySelector(
                    ".sale-item"
                ).value.trim();

            const qty =
                Number(
                    row.querySelector(
                        ".sale-qty"
                    ).value
                ) || 0;

            const price =
                Number(
                    row.querySelector(
                        ".sale-price"
                    ).value
                ) || 0;

            if (
                item &&
                qty > 0
            ) {

                sales.push({
                    item,
                    qty,
                    price
                });
            }
        });

    const expenses = [];

    document
        .querySelectorAll(
            ".expense-row"
        )
        .forEach(row => {

            const name =
                row.querySelector(
                    ".expense-name"
                ).value.trim();

            const amount =
                Number(
                    row.querySelector(
                        ".expense-amount"
                    ).value
                ) || 0;

            if (
                name &&
                amount > 0
            ) {

                expenses.push({
                    name,
                    amount
                });
            }
        });

    const record = {

        id:
            Date.now(),

        date:
            date,

        sales:
            sales,

        expenses:
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
            item =>
                item.date === date
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

                alert(
                    "Daily record updated."
                );
            }
        );

        return;
    }

    dailySalesRecords.push(
        record
    );

    localStorage.setItem(
        "dailySalesRecords",
        JSON.stringify(
            dailySalesRecords
        )
    );

    updateTodaySummary();

    alert(
        "Daily sales record saved."
    );
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
        sales -
        totalExpenses;

    document.getElementById(
        "profitExpenses"
    ).textContent =
        formatMoney(totalExpenses);

    document.getElementById(
        "netProfit"
    ).textContent =
        formatMoney(netProfit);
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

    if (
        savedRecipes.length === 0
    ) {

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
                document.createElement(
                    "div"
                );

            card.className =
                "record-card";

            card.innerHTML = `

                <div>
                    <div class="record-name">
                        ${escapeHtml(
                            recipe.name
                        )}
                    </div>

                    <div class="record-info">
                        ${recipe.date}
                    </div>

                    <div class="record-info">
                        Total Cost:
                        <strong>
                            ${formatMoney(
                                recipe.totalCost
                            )}
                        </strong>
                    </div>
                </div>

                <button
                    class="danger-button"
                    onclick="deleteRecipe(${recipe.id})"
                >
                    Delete
                </button>

            `;

            container.appendChild(
                card
            );
        });
}


function renderSavedMenus() {

    const container =
        document.getElementById(
            "savedMenusList"
        );

    container.innerHTML = "";

    if (
        savedMenus.length === 0
    ) {

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
                document.createElement(
                    "div"
                );

            card.className =
                "record-card";

            card.innerHTML = `

                <div>
                    <div class="record-name">
                        Menu of the Day
                    </div>

                    <div class="record-info">
                        ${menu.date}
                    </div>

                    <div class="record-info">
                        ${menu.items.length}
                        menu item(s)
                    </div>
                </div>

                <button
                    class="danger-button"
                    onclick="deleteMenu(${menu.id})"
                >
                    Delete
                </button>

            `;

            container.appendChild(
                card
            );
        });
}


function renderSavedSales() {

    const container =
        document.getElementById(
            "savedSalesList"
        );

    container.innerHTML = "";

    if (
        dailySalesRecords.length === 0
    ) {

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
                document.createElement(
                    "div"
                );

            card.className =
                "record-card";

            card.innerHTML = `

                <div>
                    <div class="record-name">
                        ${record.date}
                    </div>

                    <div class="record-info">
                        Sales:
                        ${formatMoney(
                            record.totalSales
                        )}
                    </div>

                    <div class="record-info">
                        Expenses:
                        ${formatMoney(
                            record.totalExpenses
                        )}
                    </div>

                    <div class="record-info">
                        Profit:
                        <strong style="color:#16834b;">
                            ${formatMoney(
                                record.profit
                            )}
                        </strong>
                    </div>
                </div>

                <button
                    class="danger-button"
                    onclick="deleteSalesRecord(${record.id})"
                >
                    Delete
                </button>

            `;

            container.appendChild(
                card
            );
        });
}


/* =========================================================
   DELETE
========================================================= */

function deleteRecipe(id) {

    showConfirm(
        "Delete Recipe",
        "Delete this saved recipe?",
        function () {

            savedRecipes =
                savedRecipes.filter(
                    recipe =>
                        recipe.id !== id
                );

            localStorage.setItem(
                "savedRecipes",
                JSON.stringify(
                    savedRecipes
                )
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
                    menu =>
                        menu.id !== id
                );

            localStorage.setItem(
                "savedMenus",
                JSON.stringify(
                    savedMenus
                )
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
                    record =>
                        record.id !== id
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
            record =>
                record.date === today
        );

    let sales = 0;
    let expenses = 0;
    let profit = 0;

    records.forEach(record => {

        sales +=
            Number(
                record.totalSales
            ) || 0;

        expenses +=
            Number(
                record.totalExpenses
            ) || 0;

        profit +=
            Number(
                record.profit
            ) || 0;
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
        document.createElement(
            "div"
        );

    div.textContent =
        text;

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

        const recipeDate =
            document.getElementById(
                "recipeDate"
            );

        const menuDate =
            document.getElementById(
                "menuDate"
            );

        const salesDate =
            document.getElementById(
                "salesDate"
            );

        if (recipeDate) {
            recipeDate.value =
                today;
        }

        if (menuDate) {
            menuDate.value =
                today;
        }

        if (salesDate) {
            salesDate.value =
                today;
        }

        updateTodaySummary();
    }
);

// Supabase commercial version

const SUPABASE_URL = "https://msfapslfenhsshzspwua.supabase.co";

 

const SUPABASE_KEY = "sb_publishable_ZNFssu6P5t-0DuRF6bflgw_l_t1EVBI";

 

const supabaseClient = window.supabase.createClient(

    SUPABASE_URL,

    SUPABASE_KEY

);

/* =========================================================

   KARINDERYA KALKULATOR

   MOBILE-FIRST BUSINESS CALCULATOR

========================================================= */

 

 

/* =========================================================

   LOCAL STORAGE

========================================================= */

 

let savedRecipes = [];

let savedMenus = [];

let ingredientPrices = [];

let otherItems = [];

let dailySalesRecords = [];

let profitRecords = [];

let targetFoodCost = 40;

 

let currentUserId = null;

let userDataLoaded = false;

let currentSalesSoldOutFoodIds = [];

 

/* =========================================================

   USER-SCOPED LOCAL DATA

   =========================================================

   Recipes, menus, daily sales and profit records are kept

   locally, but under the authenticated user's ID.

   This prevents Account 2 from seeing Account 1's local data.

========================================================= */

 

function userStorageKey(name) {

    if (!currentUserId) {

        return null;

    }

    return "kk_" + currentUserId + "_" + name;

}

 

function readUserData(name, fallback) {

    const key = userStorageKey(name);

    if (!key) return fallback;

 

    try {

        const value = localStorage.getItem(key);

        return value === null ? fallback : JSON.parse(value);

    } catch (error) {

        console.error("Unable to read user data:", name, error);

        return fallback;

    }

}

 

function saveUserData(name, value) {

    const key = userStorageKey(name);

    if (!key) return;

 

    localStorage.setItem(key, JSON.stringify(value));

}

 

function loadUserScopedData(userId) {

    currentUserId = userId || null;

    userDataLoaded = false;

 

    if (!currentUserId) {

        savedRecipes = [];

        savedMenus = [];

        ingredientPrices = [];

        otherItems = [];

        dailySalesRecords = [];

        profitRecords = [];

        targetFoodCost = 40;

        currentSalesSoldOutFoodIds = [];

        return;

    }

 

    /*

       IMPORTANT:

       The old version stored all non-Supabase data in unscoped

       localStorage. On the first authenticated login after this

       update, migrate that old data to THIS account only.

       The first account to log in after deployment must be Account 1.

    */

    const migrationKey = "kk_legacy_data_migrated";

 

    if (

        localStorage.getItem(migrationKey) !== "yes" &&

        (

            localStorage.getItem("savedRecipes") !== null ||

            localStorage.getItem("savedMenus") !== null ||

            localStorage.getItem("dailySalesRecords") !== null ||

            localStorage.getItem("profitRecords") !== null

        )

    ) {

        try {

            const legacyRecipes =

                JSON.parse(localStorage.getItem("savedRecipes")) || [];

            const legacyMenus =

                JSON.parse(localStorage.getItem("savedMenus")) || [];

            const legacySales =

                JSON.parse(localStorage.getItem("dailySalesRecords")) || [];

            const legacyProfit =

                JSON.parse(localStorage.getItem("profitRecords")) || [];

            const legacyTarget =

                Number(localStorage.getItem("targetFoodCost"));

 

            saveUserData("savedRecipes", legacyRecipes);

            saveUserData("savedMenus", legacyMenus);

            saveUserData("dailySalesRecords", legacySales);

            saveUserData("profitRecords", legacyProfit);

 

            if (legacyTarget > 0) {

                saveUserData("targetFoodCost", legacyTarget);

            }

 

            localStorage.setItem(migrationKey, "yes");

 

            localStorage.removeItem("savedRecipes");

            localStorage.removeItem("savedMenus");

            localStorage.removeItem("dailySalesRecords");

            localStorage.removeItem("profitRecords");

            localStorage.removeItem("targetFoodCost");

        } catch (error) {

            console.error("Legacy data migration error:", error);

        }

    }

 

    savedRecipes = readUserData("savedRecipes", []);

    savedMenus = readUserData("savedMenus", []);

    dailySalesRecords = readUserData("dailySalesRecords", []);

    profitRecords = readUserData("profitRecords", []);

 

    targetFoodCost =

        Number(readUserData("targetFoodCost", 40));

 

    if (!targetFoodCost || targetFoodCost <= 0) {

        targetFoodCost = 40;

    }

 

    /*

       Ingredients and Other Items are cloud data. They are loaded

       separately from Supabase after authentication.

    */

    ingredientPrices = [];

    otherItems = [];

 

    userDataLoaded = true;

}

 

/* =========================================================

   MASTER INGREDIENT LIST

========================================================= */

 

const masterIngredients = [

 

    "Ampalaya",

    "Baguio Beans",

    "Bamboo Shoots",

    "Bell Pepper",

    "Cabbage",

    "Carrots",

    "Cauliflower",

    "Corn",

    "Cucumber",

    "Eggplant / Talong",

    "Garlic / Bawang",

    "Ginger / Luya",

    "Kangkong",

    "Kalabasa",

    "Labanos",

    "Malunggay",

    "Okra",

    "Onion / Sibuyas",

    "Pechay",

    "Potato / Patatas",

    "Sayote",

    "Sitaw",

    "Spinach",

    "Spring Onion",

    "Sweet Potato / Kamote",

    "Tomato / Kamatis",

    "Upo",

 

    "Bay Leaf / Laurel",

    "Basil",

    "Black Pepper",

    "Chili",

    "Cinnamon",

    "Cloves",

    "Coriander",

    "Cumin",

    "Curry Powder",

    "Garlic Powder",

    "Onion Powder",

    "Oregano",

    "Paprika",

    "Rosemary",

    "Star Anise",

    "Turmeric",

    "Five Spice",

 

    "Soy Sauce / Toyo",

    "Vinegar / Suka",

    "Fish Sauce / Patis",

    "Oyster Sauce",

    "Banana Ketchup",

    "Tomato Ketchup",

    "Mayonnaise",

    "Mustard",

    "Bagoong",

    "Mang Tomas",

    "Worcestershire Sauce",

    "Liquid Seasoning",

    "Hot Sauce",

 

    "Magic Sarap",

    "MSG / Ajinomoto",

    "Knorr Chicken Cube",

    "Knorr Beef Cube",

    "Sinigang Mix",

    "Kare-Kare Mix",

    "Menudo Mix",

    "Caldereta Mix",

    "Tinola Mix",

 

    "Rice",

    "Cornstarch",

    "All-Purpose Flour",

    "Breadcrumbs",

    "Pasta",

    "Spaghetti",

    "Bihon",

    "Pancit Canton Noodles",

    "Sotanghon",

    "Sugar",

    "Salt",

    "Baking Powder",

 

    "Cooking Oil",

    "Coconut Oil",

    "Margarine",

    "Butter",

    "Lard",

 

    "Eggs",

    "Evaporated Milk",

    "Condensed Milk",

    "Fresh Milk",

    "All-Purpose Cream",

    "Cheese",

 

    "Coconut Milk / Gata",

    "Coconut Cream",

 

    "Tomato Sauce",

    "Tomato Paste",

    "Canned Corn",

    "Canned Mushrooms",

    "Canned Pineapple",

    "Fruit Cocktail",

    "Sardines",

    "Tuna",

 

    "Chicken",

    "Chicken Breast",

    "Chicken Thigh",

    "Whole Chicken",

    "Pork",

    "Pork Belly",

    "Pork Shoulder",

    "Ground Pork",

    "Beef",

    "Ground Beef",

    "Beef Liver",

    "Pork Liver",

    "Bangus",

    "Tilapia",

    "Galunggong",

    "Shrimp",

    "Squid",

 

    "__custom__"

];

 

 

/* =========================================================

   MASTER OTHER ITEMS

========================================================= */

 

const masterOtherItems = [

 

    "Coca-Cola",

    "Sprite",

    "Royal",

    "Pepsi",

    "Mountain Dew",

 

    "Wilkins",

    "Nature's Spring",

    "Absolute",

    "Summit",

 

    "Zest-O",

    "C2",

    "Tang",

    "Nestea",

    "Del Monte Juice",

 

    "Lucky Me Pancit Canton",

    "Lucky Me Noodles",

    "Payless",

    "Nissin",

 

    "SkyFlakes",

    "Fita",

    "Hansel",

    "Rebisco",

    "Cream-O",

    "Chippy",

    "Piattos",

    "Nova",

    "Clover",

 

    "Century Tuna",

    "Ligo",

    "Argentina",

    "Purefoods",

    "Mega",

 

    "Nescafe",

    "Great Taste",

    "Kopiko",

    "San Mig Coffee",

 

    "Milo",

    "Bear Brand",

    "Ovaltine",

 

    "Gardenia",

    "Pinoy Tasty",

    "Pandesal",

 

    "Silver Swan",

    "Datu Puti",

    "Marca Pina",

    "UFC",

    "Del Monte",

    "Mang Tomas",

    "Mama Sita's",

 

    "Safeguard",

    "Palmolive",

    "Sunsilk",

    "Cream Silk",

    "Colgate",

    "Closeup",

    "Tide",

    "Surf",

    "Downy",

    "Zonrox",

    "Joy",

 

    "__custom__"

];

 

 

/* =========================================================

   BASIC UTILITIES

========================================================= */

 

function todayString() {

 

    const d = new Date();

 

    const year = d.getFullYear();

 

    const month =

        String(d.getMonth() + 1).padStart(2, "0");

 

    const day =

        String(d.getDate()).padStart(2, "0");

 

    return year + "-" + month + "-" + day;

}

 

 

function normalizeDate(date) {

 

    if (!date) {

        return todayString();

    }

 

    return date;

}

 

 

function numberValue(value) {

 

    const n = Number(value);

 

    if (isNaN(n)) {

        return 0;

    }

 

    return n;

}

 

 

function money(value) {

 

    return "₱" + numberValue(value).toLocaleString(

        "en-PH",

        {

            minimumFractionDigits: 2,

            maximumFractionDigits: 2

        }

    );

}

 

 

function escapeHtml(value) {

 

    return String(value || "")

        .replace(/&/g, "&amp;")

        .replace(/</g, "&lt;")

        .replace(/>/g, "&gt;")

        .replace(/"/g, "&quot;")

        .replace(/'/g, "&#039;");

}

 

 

function saveAllData() {

    if (!currentUserId || !userDataLoaded) {

        return;

    }

 

    saveUserData("savedRecipes", savedRecipes);

    saveUserData("savedMenus", savedMenus);

    saveUserData("dailySalesRecords", dailySalesRecords);

    saveUserData("profitRecords", profitRecords);

    saveUserData("targetFoodCost", targetFoodCost);

}

 

/* =========================================================

   SCREEN NAVIGATION

========================================================= */

 

async function showScreen(screenId) {

 

    const screens =

        document.querySelectorAll(".screen");

 

    screens.forEach(function(screen) {

        screen.classList.remove("active");

    });

 

    const target =

        document.getElementById(screenId);

 

    if (target) {

        target.classList.add("active");

    }

 

    if (screenId === "homeScreen") {

        updateDashboard();

    }

 

    if (screenId === "ingredientsScreen") {

        populateMasterIngredientSelect();

        populateMasterOtherItemSelect();

        await renderIngredientList();

        renderOtherItemList();

    }

 

    if (screenId === "recipeScreen") {

        await loadRecipeScreen();

    }

 

    if (screenId === "menuScreen") {

        loadMenuOfDay();

    }

 

    if (screenId === "salesScreen") {

        loadDailySales();

    }

 

    if (screenId === "profitScreen") {

        loadProfitCalculator();

    }

 

    if (screenId === "recordsScreen") {

        renderMonthlyRecords();

    }

 

    window.scrollTo(0, 0);

}

 

 

/* =========================================================

   INGREDIENT MASTER DROPDOWN

========================================================= */

 

function populateMasterIngredientSelect() {

 

    const select =

        document.getElementById("ingredientName");

 

    if (!select) {

        return;

    }

 

    const current = select.value;

 

    select.innerHTML =

        '<option value="">Select ingredient...</option>';

 

    masterIngredients.forEach(function(name) {

 

        const option =

            document.createElement("option");

 

        option.value = name;

        option.textContent =

            name === "__custom__"

                ? "➕ Add Custom Ingredient"

                : name;

 

        select.appendChild(option);

    });

 

    if (current) {

        select.value = current;

    }

}

 

 

function populateMasterOtherItemSelect() {

 

    const select =

        document.getElementById("otherItemName");

 

    if (!select) {

        return;

    }

 

    const current = select.value;

 

    select.innerHTML =

        '<option value="">Select other item...</option>';

 

    masterOtherItems.forEach(function(name) {

 

        const option =

            document.createElement("option");

 

        option.value = name;

        option.textContent =

            name === "__custom__"

                ? "➕ Add Custom Item"

                : name;

 

        select.appendChild(option);

    });

 

    if (current) {

        select.value = current;

    }

}

 

 

function handleCustomIngredient() {

 

    const value =

        document.getElementById("ingredientName").value;

 

    const group =

        document.getElementById("customIngredientGroup");

 

    if (value === "__custom__") {

        group.style.display = "block";

    } else {

        group.style.display = "none";

    }

}

 

 

function handleCustomOtherItem() {

 

    const value =

        document.getElementById("otherItemName").value;

 

    const group =

        document.getElementById("customOtherItemGroup");

 

    if (value === "__custom__") {

        group.style.display = "block";

    } else {

        group.style.display = "none";

    }

}

 

 

/* =========================================================

   INGREDIENTS

========================================================= */

 

async function saveIngredient() {

 

    const selected =

        document.getElementById("ingredientName").value;

 

    let name = selected;

 

    if (selected === "__custom__") {

 

        name =

            document.getElementById(

                "customIngredientName"

            ).value.trim();

    }

 

    const purchasePrice =

        numberValue(

            document.getElementById(

                "ingredientPurchasePrice"

            ).value

        );

 

    const quantity =

        numberValue(

            document.getElementById(

                "ingredientQuantity"

            ).value

        );

 

    const unit =

        document.getElementById(

            "ingredientUnit"

        ).value;

 

    if (!name) {

        showMessage(

            "ingredientMessage",

            "Please select or enter an ingredient.",

            "error"

        );

        return;

    }

 

    if (purchasePrice <= 0 || quantity <= 0) {

        showMessage(

            "ingredientMessage",

            "Please enter a valid purchase price and quantity.",

            "error"

        );

        return;

    }

 

    const unitCost =

        purchasePrice / quantity;

 

    const existing =

        ingredientPrices.find(function(item) {

            return item.name.toLowerCase() ===

                name.toLowerCase();

        });

 

    if (existing) {

 

        existing.purchasePrice = purchasePrice;

        existing.quantity = quantity;

        existing.unit = unit;

        existing.unitCost = unitCost;

 

    } else {

 

         ingredientPrices.push({

            id: Date.now().toString(),

            name: name,

            purchasePrice: purchasePrice,

            quantity: quantity,

            unit: unit,

            unitCost: unitCost

        });

    }

 

const userId = await getCurrentUserId();

 

if (userId) {

    const { error } = await supabaseClient

        .from("ingredients")

        .insert({

            user_id: userId,

            name: name,

            purchase_price: purchasePrice,

            quantity: quantity,

            unit: unit,

            unit_cost: unitCost

        });

 

    if (error) {

        console.error("Supabase ingredient save error:", error);

    }

}

 

    saveAllData();

 

    showMessage(

        "ingredientMessage",

        "Ingredient saved successfully.",

        "success"

    );

 

    document.getElementById(

        "ingredientPurchasePrice"

    ).value = "";

 

    document.getElementById(

        "ingredientQuantity"

    ).value = "";

 

    document.getElementById(

        "customIngredientName"

    ).value = "";

 

    document.getElementById(

        "ingredientName"

    ).value = "";

 

    handleCustomIngredient();

 

    renderIngredientList();

}

 

 

async function renderIngredientList() {

    const container = document.getElementById("ingredientList");

    if (!container) return;

 

    const userId = await getCurrentUserId();

 

    if (!userId) {

        container.innerHTML =

            '<div class="empty">Please log in to view saved ingredients.</div>';

        return;

    }

 

    const { data, error } =

        await supabaseClient

            .from("ingredients")

            .select("*")

            .eq("user_id", userId)

            .order("created_at", { ascending: false });

 

    if (error) {

        console.error("Supabase ingredients load error:", error);

        container.innerHTML =

            '<div class="empty">Unable to load saved ingredients.</div>';

        return;

    }

 

    ingredientPrices =

        (data || []).map(function(item) {

            return {

                id: String(item.id),

                name: item.name,

                purchasePrice: numberValue(item.purchase_price),

                quantity: numberValue(item.quantity),

                unit: item.unit || "",

                unitCost: numberValue(item.unit_cost)

            };

        });

 

    if (ingredientPrices.length === 0) {

        container.innerHTML =

            '<div class="empty">No ingredients saved yet.</div>';

        return;

    }

 

    container.innerHTML = "";

 

    ingredientPrices.forEach(function(item) {

        const div = document.createElement("div");

        div.className = "list-item";

 

        div.innerHTML =

            '<div class="list-item-title">' +

            escapeHtml(item.name) +

            '</div>' +

 

            '<div class="list-item-info">' +

            "Purchase: " +

            money(item.purchasePrice) +

            " | Quantity: " +

            item.quantity +

            " " +

            escapeHtml(item.unit) +

            "<br>" +

            "Unit Cost: " +

            money(item.unitCost) +

            "</div>" +

 

            '<div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap;">' +

            '<button class="btn btn-secondary btn-small" onclick="editIngredient(\'' +

            item.id +

            '\')">Edit</button>' +

            '<button class="btn btn-danger btn-small" onclick="deleteIngredient(\'' +

            item.id +

            '\')">Delete</button>' +

            "</div>";

 

        container.appendChild(div);

    });

}

 

 

async function editIngredient(id) {

 

    const item = ingredientPrices.find(function(ingredient) {

        return String(ingredient.id) === String(id);

    });

 

    if (!item) {

        return;

    }

 

    const purchasePriceInput = prompt(

        "Purchase price:",

        item.purchasePrice

    );

 

    if (purchasePriceInput === null) {

        return;

    }

 

    const quantityInput = prompt(

        "Quantity:",

        item.quantity

    );

 

    if (quantityInput === null) {

        return;

    }

 

    const unitInput = prompt(

        "Unit (kg, g, liter, ml, piece, etc.):",

        item.unit

    );

 

    if (unitInput === null) {

        return;

    }

 

    const purchasePrice = numberValue(purchasePriceInput);

    const quantity = numberValue(quantityInput);

    const unit = unitInput.trim();

 

    if (purchasePrice < 0 || quantity <= 0 || !unit) {

        alert("Please enter a valid purchase price, quantity, and unit.");

        return;

    }

 

    const unitCost = purchasePrice / quantity;

 

    const { error } =

        await supabaseClient

            .from("ingredients")

            .update({

                purchase_price: purchasePrice,

                quantity: quantity,

                unit: unit,

                unit_cost: unitCost

            })

            .eq("id", Number(id))

            .eq("user_id", currentUserId);

 

    if (error) {

        console.error("Supabase ingredient edit error:", error);

        showMessage(

            "ingredientMessage",

            "Unable to update ingredient.",

            "error"

        );

        return;

    }

 

    await renderIngredientList();

    populateMasterIngredientSelect();

    refreshRecipeIngredientDropdowns();

}

 

 

async function deleteIngredient(id) {

    if (!confirm("Delete this ingredient?")) {

        return;

    }

 

    const { error } =

        await supabaseClient

            .from("ingredients")

            .delete()

            .eq("id", Number(id))

            .eq("user_id", currentUserId);

 

    if (error) {

        console.error("Supabase ingredient delete error:", error);

        showMessage(

            "ingredientMessage",

            "Unable to delete ingredient.",

            "error"

        );

        return;

    }

 

    await renderIngredientList();

}

 

 

/* =========================================================

   OTHER ITEMS

========================================================= */

 

async function saveOtherItem() {

 

    const selected =

        document.getElementById("otherItemName").value;

 

    let name = selected;

 

    if (selected === "__custom__") {

 

        name =

            document.getElementById(

                "customOtherItemName"

            ).value.trim();

    }

 

    const purchasePrice =

        numberValue(

            document.getElementById(

                "otherPurchasePrice"

            ).value

        );

 

    const quantity =

        numberValue(

            document.getElementById(

                "otherQuantity"

            ).value

        );

 

    const unit =

        document.getElementById(

            "otherUnit"

        ).value;

 

    const sellingPrice =

        numberValue(

            document.getElementById(

                "otherSellingPrice"

            ).value

        );

 

    if (!name) {

        showMessage(

            "otherItemMessage",

            "Please select or enter an item.",

            "error"

        );

        return;

    }

 

    if (

        purchasePrice <= 0 ||

        quantity <= 0 ||

        sellingPrice <= 0

    ) {

        showMessage(

            "otherItemMessage",

            "Please enter valid purchase, quantity and selling prices.",

            "error"

        );

        return;

    }

 

    const unitCost =

        purchasePrice / quantity;

 

    const existing =

        otherItems.find(function(item) {

            return item.name.toLowerCase() ===

                name.toLowerCase();

        });

 

    if (existing) {

 

        existing.purchasePrice = purchasePrice;

        existing.quantity = quantity;

        existing.unit = unit;

        existing.unitCost = unitCost;

        existing.sellingPrice = sellingPrice;

 

    } else {

 

        otherItems.push({

            id: Date.now().toString(),

            name: name,

            purchasePrice: purchasePrice,

            quantity: quantity,

            unit: unit,

            unitCost: unitCost,

            sellingPrice: sellingPrice

        });

    }

 

    /* SAVE OTHER ITEM TO SUPABASE */

 

    const userId = await getCurrentUserId();

 

    if (userId) {

 

        const { error } =

            await supabaseClient

                .from("other_items")

                .insert({

                    user_id: userId,

                    name: name,

                    purchase_price: purchasePrice,

                    quantity: quantity,

                    unit: unit,

                    unit_cost: unitCost,

                    selling_price: sellingPrice

                });

 

        if (error) {

            console.error(

                "Supabase other item save error:",

                error

            );

        }

    }

 

    saveAllData();

 

    showMessage(

        "otherItemMessage",

        "Other item saved successfully.",

        "success"

    );

 

    document.getElementById(

        "otherPurchasePrice"

    ).value = "";

 

    document.getElementById(

        "otherQuantity"

    ).value = "";

 

    document.getElementById(

        "otherSellingPrice"

    ).value = "";

 

    document.getElementById(

        "customOtherItemName"

    ).value = "";

 

    document.getElementById(

        "otherItemName"

    ).value = "";

 

    handleCustomOtherItem();

 

    renderOtherItemList();

}

 

 

async function renderOtherItemList() {

    const container = document.getElementById("otherItemList");

    if (!container) return;

 

    const userId = await getCurrentUserId();

 

    if (!userId) {

        container.innerHTML =

            '<div class="empty">Please log in to view saved items.</div>';

        return;

    }

 

    const { data, error } =

        await supabaseClient

            .from("other_items")

            .select("*")

            .eq("user_id", userId)

            .order("created_at", { ascending: false });

 

    if (error) {

        console.error("Supabase other items load error:", error);

        container.innerHTML =

            '<div class="empty">Unable to load saved other items.</div>';

        return;

    }

 

    otherItems =

        (data || []).map(function(item) {

            return {

                id: String(item.id),

                name: item.name,

                purchasePrice: numberValue(item.purchase_price),

                quantity: numberValue(item.quantity),

                unit: item.unit || "",

                unitCost: numberValue(item.unit_cost),

                sellingPrice: numberValue(item.selling_price)

            };

        });

 

    if (otherItems.length === 0) {

        container.innerHTML =

            '<div class="empty">No other items saved yet.</div>';

        return;

    }

 

    container.innerHTML = "";

 

    otherItems.forEach(function(item) {

        const div = document.createElement("div");

        div.className = "list-item";

 

        div.innerHTML =

            '<div class="list-item-title">' +

            escapeHtml(item.name) +

            '</div>' +

 

            '<div class="list-item-info">' +

            "Purchase: " +

            money(item.purchasePrice) +

            " | Quantity: " +

            item.quantity +

            " " +

            escapeHtml(item.unit) +

            "<br>" +

            "Unit Cost: " +

            money(item.unitCost) +

            "<br>" +

            "Selling Price: " +

            money(item.sellingPrice) +

            "</div>";

 

        container.appendChild(div);

    });

}

 

 

/* =========================================================

   RECIPE

========================================================= */

 

async function loadRecipeScreen() {

 

    const dateInput =

        document.getElementById("recipeDate");

 

    await renderIngredientList();

 

    if (!dateInput.value) {

        dateInput.value = todayString();

    }

 

    const savedDate =

        document.getElementById("savedRecipeDate");

 

    if (!savedDate.value) {

        savedDate.value = dateInput.value;

    }

 

    if (

        document.getElementById(

            "recipeIngredients"

        ).children.length === 0

    ) {

        addRecipeIngredient();

    }

 

    loadSavedRecipes();

}

 

 

function addRecipeIngredient() {

 

    const container =

        document.getElementById(

            "recipeIngredients"

        );

 

    const row =

        document.createElement("div");

 

    row.className =

        "recipe-ingredient-row";

 

    row.innerHTML =

        '<div>' +

        '<label style="font-size:10px;font-weight:700;">Ingredient</label>' +

        '<select class="recipe-ingredient-select" onchange="calculateRecipeTotal(); refreshRecipeIngredientDropdowns()">' +

        '<option value="">Select...</option>' +

        '</select>' +

        '</div>' +

 

        '<div>' +

        '<label style="font-size:10px;font-weight:700;">Amount</label>' +

        '<input type="number" class="recipe-amount" min="0" step="0.001" oninput="calculateRecipeTotal()">' +

        '</div>' +

 

        '<div>' +

        '<label style="font-size:10px;font-weight:700;">Unit</label>' +

        '<select class="recipe-unit" onchange="calculateRecipeTotal()">' +

        '<option value="kg">kg</option>' +

        '<option value="g">g</option>' +

        '<option value="liter">liter</option>' +

        '<option value="ml">ml</option>' +

        '<option value="piece">piece</option>' +

        '</select>' +

        '</div>' +

 

        '<button class="btn btn-danger btn-small" onclick="removeRecipeIngredient(this)">×</button>';

 

    container.appendChild(row);

 

    populateRecipeIngredientSelect(row);

}

 

 

function populateRecipeIngredientSelect(row) {

 

    const select =

        row.querySelector(

            ".recipe-ingredient-select"

        );

 

    if (!select) {

        return;

    }

 

    const currentValue = select.value;

 

    const selectedIds = [];

 

    document

        .querySelectorAll(".recipe-ingredient-select")

        .forEach(function(otherSelect) {

 

            if (

                otherSelect !== select &&

                otherSelect.value

            ) {

                selectedIds.push(String(otherSelect.value));

            }

        });

 

    select.innerHTML =

        '<option value="">Select...</option>';

 

    ingredientPrices.forEach(function(item) {

 

        const option =

            document.createElement("option");

 

        option.value = item.id;

        option.textContent = item.name;

 

        if (

            selectedIds.includes(String(item.id)) &&

            String(item.id) !== String(currentValue)

        ) {

            return;

        }

 

        select.appendChild(option);

    });

 

    if (currentValue) {

        select.value = currentValue;

    }

}

 

 

function refreshRecipeIngredientDropdowns() {

 

    document

        .querySelectorAll(".recipe-ingredient-row")

        .forEach(function(row) {

            populateRecipeIngredientSelect(row);

        });

}

 

 

function removeRecipeIngredient(button) {

 

    button.parentElement.remove();

 

    calculateRecipeTotal();

    refreshRecipeIngredientDropdowns();

}

 

 

function getIngredientUnitCost(item) {

 

    if (!item) {

        return 0;

    }

 

    return numberValue(item.unitCost);

}

 

 

function convertAmount(

    amount,

    fromUnit,

    toUnit

) {

 

    amount = numberValue(amount);

 

    if (fromUnit === toUnit) {

        return amount;

    }

 

    if (

        fromUnit === "kg" &&

        toUnit === "g"

    ) {

        return amount * 1000;

    }

 

    if (

        fromUnit === "g" &&

        toUnit === "kg"

    ) {

        return amount / 1000;

    }

 

    if (

        fromUnit === "liter" &&

        toUnit === "ml"

    ) {

        return amount * 1000;

    }

 

    if (

        fromUnit === "ml" &&

        toUnit === "liter"

    ) {

        return amount / 1000;

    }

 

    return amount;

}

 

 

function calculateRecipeTotal() {

 

    const rows =

        document.querySelectorAll(

            "#recipeIngredients .recipe-ingredient-row"

        );

 

    let total = 0;

 

    rows.forEach(function(row) {

 

        const ingredientId =

            row.querySelector(

                ".recipe-ingredient-select"

            ).value;

 

        const amount =

            numberValue(

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

                function(item) {

                    return item.id === ingredientId;

                }

            );

 

        if (!ingredient || amount <= 0) {

            return;

        }

 

        let cost = 0;

 

        if (

            ingredient.unit === unit

        ) {

 

            cost =

                amount *

                getIngredientUnitCost(ingredient);

 

        } else if (

            (

                ingredient.unit === "kg" ||

                ingredient.unit === "g"

            ) &&

            (

                unit === "kg" ||

                unit === "g"

            )

        ) {

 

            const converted =

                convertAmount(

                    amount,

                    unit,

                    ingredient.unit

                );

 

            cost =

                converted *

                getIngredientUnitCost(ingredient);

 

        } else if (

            (

                ingredient.unit === "liter" ||

                ingredient.unit === "ml"

            ) &&

            (

                unit === "liter" ||

                unit === "ml"

            )

        ) {

 

            const converted =

                convertAmount(

                    amount,

                    unit,

                    ingredient.unit

                );

 

            cost =

                converted *

                getIngredientUnitCost(ingredient);

 

        } else {

 

            cost =

                amount *

                getIngredientUnitCost(ingredient);

        }

 

        total += cost;

    });

 

    document.getElementById(

        "recipeTotalCost"

    ).textContent = money(total);

 

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

 

    if (!date || !name) {

 

        showMessage(

            "recipeMessage",

            "Please enter the date and recipe name.",

            "error"

        );

 

        return;

    }

 

    const rows =

        document.querySelectorAll(

            "#recipeIngredients .recipe-ingredient-row"

        );

 

    const ingredients = [];

    let totalCost = 0;

 

    rows.forEach(function(row) {

 

        const ingredientId =

            row.querySelector(

                ".recipe-ingredient-select"

            ).value;

 

        const amount =

            numberValue(

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

                function(item) {

                    return item.id === ingredientId;

                }

            );

 

        if (!ingredient || amount <= 0) {

            return;

        }

 

        let cost = 0;

 

        if (

            ingredient.unit === unit

        ) {

 

            cost =

                amount *

                getIngredientUnitCost(ingredient);

 

        } else if (

            (

                ingredient.unit === "kg" ||

                ingredient.unit === "g"

            ) &&

            (

                unit === "kg" ||

                unit === "g"

            )

        ) {

 

            const converted =

                convertAmount(

                    amount,

                    unit,

                    ingredient.unit

                );

 

            cost =

                converted *

                getIngredientUnitCost(ingredient);

 

        } else if (

            (

                ingredient.unit === "liter" ||

                ingredient.unit === "ml"

            ) &&

            (

                unit === "liter" ||

                unit === "ml"

            )

        ) {

 

            const converted =

                convertAmount(

                    amount,

                    unit,

                    ingredient.unit

                );

 

            cost =

                converted *

                getIngredientUnitCost(ingredient);

 

        } else {

 

            cost =

                amount *

                getIngredientUnitCost(ingredient);

        }

 

        totalCost += cost;

 

        ingredients.push({

            ingredientId: ingredient.id,

            ingredientName: ingredient.name,

            amount: amount,

            unit: unit,

            cost: cost

        });

    });

 

    if (ingredients.length === 0) {

 

        showMessage(

            "recipeMessage",

            "Please add at least one ingredient.",

            "error"

        );

 

        return;

    }

 

    const existing =

        savedRecipes.find(

            function(recipe) {

                return (

                    recipe.date === date &&

                    recipe.name.toLowerCase() ===

                    name.toLowerCase()

                );

            }

        );

 

    if (existing) {

 

        existing.totalCost = totalCost;

        existing.ingredients = ingredients;

 

    } else {

 

        savedRecipes.push({

            id: Date.now().toString(),

            date: date,

            name: name,

            totalCost: totalCost,

            ingredients: ingredients

        });

    }

 

    saveAllData();

 

    showMessage(

        "recipeMessage",

        "Recipe saved successfully. It will automatically appear in Menu of the Day.",

        "success"

    );

 

    clearRecipeForm(false);

 

    document.getElementById(

        "savedRecipeDate"

    ).value = date;

 

    loadSavedRecipes();

 

    if (

        document.getElementById(

            "menuDate"

        )

    ) {

        document.getElementById(

            "menuDate"

        ).value = date;

    }

}

 

 

function clearRecipeForm(showMessageFlag) {

 

    if (showMessageFlag === undefined) {

        showMessageFlag = true;

    }

 

    document.getElementById(

        "recipeName"

    ).value = "";

 

    document.getElementById(

        "recipeIngredients"

    ).innerHTML = "";

 

    addRecipeIngredient();

 

    document.getElementById(

        "recipeTotalCost"

    ).textContent = money(0);

 

    if (showMessageFlag) {

 

        showMessage(

            "recipeMessage",

            "Recipe form cleared.",

            "info"

        );

    }

}

 

 

function loadSavedRecipes() {

 

    const date =

        document.getElementById(

            "savedRecipeDate"

        ).value;

 

    const container =

        document.getElementById(

            "savedRecipesList"

        );

 

    if (!date) {

        container.innerHTML =

            '<div class="empty">Select a date.</div>';

        return;

    }

 

    const recipes =

        savedRecipes.filter(

            function(recipe) {

                return recipe.date === date;

            }

        );

 

    if (recipes.length === 0) {

 

        container.innerHTML =

            '<div class="empty">No recipes saved for this date.</div>';

 

        return;

    }

 

    container.innerHTML = "";

 

    recipes.forEach(function(recipe) {

 

        const div =

            document.createElement("div");

 

        div.className = "list-item";

 

        div.innerHTML =

            '<div class="list-item-title">' +

            escapeHtml(recipe.name) +

            '</div>' +

 

            '<div class="list-item-info">' +

            "Recipe Cost: " +

            money(recipe.totalCost) +

            "<br>" +

            "Ingredients: " +

            recipe.ingredients.length +

            "</div>" +

 

            '<div style="margin-top:8px;">' +

            '<button class="btn btn-danger btn-small" onclick="deleteSavedRecipe(\'' +

            recipe.id +

            '\')">Delete</button>' +

            "</div>";

 

        container.appendChild(div);

    });

}

 

 

function deleteSavedRecipe(id) {

 

    if (!confirm("Delete this recipe?")) {

        return;

    }

 

    savedRecipes =

        savedRecipes.filter(

            function(recipe) {

                return recipe.id !== id;

            }

        );

 

    saveAllData();

 

    loadSavedRecipes();

 

    loadMenuOfDay();

}

 

 

/* =========================================================

   MENU OF THE DAY

   TARGET FOOD COST EXISTS ONLY AT THE TOP

========================================================= */

 

function getRecipesForDate(date) {

 

    return savedRecipes.filter(

        function(recipe) {

            return recipe.date === date;

        }

    );

}

 

 

function getSavedMenuForDate(date) {

 

    return savedMenus.find(

        function(menu) {

            return menu.date === date;

        }

    );

}

 

 

function saveTargetFoodCost() {

 

    const value =

        numberValue(

            document.getElementById(

                "targetFoodCost"

            ).value

        );

 

    if (

        value <= 0 ||

        value >= 100

    ) {

 

        showMessage(

            "menuMessage",

            "Target Food Cost must be between 1% and 99%.",

            "error"

        );

 

        document.getElementById(

            "targetFoodCost"

        ).value = targetFoodCost;

 

        return;

    }

 

    targetFoodCost = value;

 

    saveAllData();

 

    loadMenuOfDay();

 

    showMessage(

        "menuMessage",

        "Target Food Cost setting saved.",

        "success"

    );

}

 

 

function loadMenuOfDay() {

 

    const dateInput =

        document.getElementById("menuDate");

 

    if (!dateInput.value) {

        dateInput.value = todayString();

    }

 

    document.getElementById(

        "targetFoodCost"

    ).value = targetFoodCost;

 

    renderMenuItems(

        dateInput.value

    );

}

 

 

function renderMenuItems(date) {

 

    const container =

        document.getElementById(

            "menuItems"

        );

 

    const recipes =

        getRecipesForDate(date);

 

    const savedMenu =

        getSavedMenuForDate(date);

 

    if (recipes.length === 0) {

 

        container.innerHTML =

            '<div class="empty">' +

            "No recipes have been saved for this date.<br>" +

            "Create recipes in Recipe of the Day first." +

            "</div>";

 

        return;

    }

 

    container.innerHTML = "";

 

    recipes.forEach(function(recipe) {

 

        let savedItem = null;

 

        if (savedMenu && Array.isArray(savedMenu.items)) {

 

            savedItem =

                savedMenu.items.find(

                    function(item) {

                        return item.recipeId === recipe.id;

                    }

                );

        }

 

        const quantity =

            savedItem &&

            numberValue(savedItem.servings) > 0

                ? numberValue(savedItem.servings)

                : 1;

 

        const actualSellingPrice =

            savedItem &&

            numberValue(savedItem.sellingPrice) > 0

                ? numberValue(savedItem.sellingPrice)

                : 0;

 

        const suggested =

            calculateSuggestedSellingPrice(

                recipe.totalCost,

                quantity

            );

 

        const selling =

            actualSellingPrice > 0

                ? actualSellingPrice

                : suggested;

 

        const sales =

            selling * quantity;

 

        const foodCostPercent =

            sales > 0

                ? recipe.totalCost / sales * 100

                : 0;

 

        const profitPercent =

            sales > 0

                ? (sales - recipe.totalCost) /

                  sales * 100

                : 0;

 

        const div =

            document.createElement("div");

 

        div.className = "menu-item";

 

        div.dataset.recipeId = recipe.id;

 

        div.innerHTML =

 

            '<div class="menu-top">' +

 

            '<div>' +

            '<div class="menu-name">' +

            escapeHtml(recipe.name) +

            '</div>' +

            '<div class="menu-cost">' +

            "Recipe Cost: " +

            money(recipe.totalCost) +

            "</div>" +

            "</div>" +

 

            '<div class="menu-field">' +

            '<label>Quantity / Servings</label>' +

            '<input type="number" class="menu-quantity" min="1" step="1" value="' +

            quantity +

            '" oninput="calculateMenuEntry(this)">' +

            "</div>" +

 

            '<div class="menu-field">' +

            '<label>Actual Selling Price</label>' +

            '<input type="number" class="menu-selling-price" min="0" step="0.01" value="' +

            roundNumber(selling) +

            '" oninput="calculateMenuEntry(this)">' +

            "</div>" +

 

            "</div>" +

 

            '<div class="menu-info">' +

 

            '<div class="menu-info-box">' +

            '<div class="menu-info-label">Suggested Price</div>' +

            '<div class="menu-info-value menu-suggested">' +

            money(suggested) +

            "</div>" +

            "</div>" +

 

            '<div class="menu-info-box">' +

            '<div class="menu-info-label">Actual Food Cost</div>' +

            '<div class="menu-info-value menu-food-cost">' +

            foodCostPercent.toFixed(2) +

            "%</div>" +

            "</div>" +

 

            '<div class="menu-info-box">' +

            '<div class="menu-info-label">Actual Profit</div>' +

            '<div class="menu-info-value menu-profit">' +

            profitPercent.toFixed(2) +

            "%</div>" +

            "</div>" +

 

            "</div>" +

 

            '<div class="menu-actions">' +

            '<button class="btn btn-primary btn-small" onclick="saveMenuItem(this)">' +

            "Save / Update" +

            "</button>" +

            "</div>";

 

        container.appendChild(div);

    });

}

 

 

function roundNumber(value) {

 

    return Math.round(

        numberValue(value) * 100

    ) / 100;

}

 

 

function calculateSuggestedSellingPrice(

    recipeCost,

    quantity

) {

 

    recipeCost =

        numberValue(recipeCost);

 

    quantity =

        numberValue(quantity);

 

    if (

        recipeCost <= 0 ||

        quantity <= 0 ||

        targetFoodCost <= 0

    ) {

        return 0;

    }

 

    const costPerServing =

        recipeCost / quantity;

 

    return costPerServing /

        (targetFoodCost / 100);

}

 

 

function calculateMenuEntry(input) {

 

    const item =

        input.closest(".menu-item");

 

    if (!item) {

        return;

    }

 

    const recipeId =

        item.dataset.recipeId;

 

    const recipe =

        savedRecipes.find(

            function(r) {

                return r.id === recipeId;

            }

        );

 

    if (!recipe) {

        return;

    }

 

    const quantity =

        numberValue(

            item.querySelector(

                ".menu-quantity"

            ).value

        );

 

    let sellingPrice =

        numberValue(

            item.querySelector(

                ".menu-selling-price"

            ).value

        );

 

    const suggested =

        calculateSuggestedSellingPrice(

            recipe.totalCost,

            quantity

        );

 

    /*

       If the selling price has never been

       entered, use the suggested price.

    */

    if (

        sellingPrice <= 0 &&

        suggested > 0

    ) {

        sellingPrice = suggested;

 

        item.querySelector(

            ".menu-selling-price"

        ).value =

            roundNumber(sellingPrice);

    }

 

    const sales =

        sellingPrice * quantity;

 

    const foodCostPercent =

        sales > 0

            ? recipe.totalCost /

              sales * 100

            : 0;

 

    const profitPercent =

        sales > 0

            ? (sales - recipe.totalCost) /

              sales * 100

            : 0;

 

    item.querySelector(

        ".menu-suggested"

    ).textContent =

        money(suggested);

 

    item.querySelector(

        ".menu-food-cost"

    ).textContent =

        foodCostPercent.toFixed(2) + "%";

 

    item.querySelector(

        ".menu-profit"

    ).textContent =

        profitPercent.toFixed(2) + "%";

}

 

 

function saveMenuItem(button) {

 

    const item =

        button.closest(".menu-item");

 

    if (!item) {

        return;

    }

 

    const date =

        document.getElementById(

            "menuDate"

        ).value;

 

    const recipeId =

        item.dataset.recipeId;

 

    const recipe =

        savedRecipes.find(

            function(r) {

                return r.id === recipeId;

            }

        );

 

    if (!recipe) {

        return;

    }

 

    const servings =

        numberValue(

            item.querySelector(

                ".menu-quantity"

            ).value

        );

 

    const sellingPrice =

        numberValue(

            item.querySelector(

                ".menu-selling-price"

            ).value

        );

 

    if (servings <= 0) {

 

        showMessage(

            "menuMessage",

            "Please enter a valid quantity or number of servings.",

            "error"

        );

 

        return;

    }

 

    if (sellingPrice <= 0) {

 

        showMessage(

            "menuMessage",

            "Please enter a valid selling price.",

            "error"

        );

 

        return;

    }

 

    let menu =

        getSavedMenuForDate(date);

 

    if (!menu) {

 

        menu = {

            id: Date.now().toString(),

            date: date,

            items: []

        };

 

        savedMenus.push(menu);

    }

 

    if (!Array.isArray(menu.items)) {

        menu.items = [];

    }

 

    const existing =

        menu.items.find(

            function(existingItem) {

                return existingItem.recipeId === recipeId;

            }

        );

 

    const menuItem = {

        recipeId: recipe.id,

        recipeName: recipe.name,

        recipeCost: recipe.totalCost,

        servings: servings,

        suggestedSellingPrice:

            calculateSuggestedSellingPrice(

                recipe.totalCost,

                servings

            ),

        sellingPrice: sellingPrice

    };

 

    if (existing) {

 

        existing.recipeName =

            menuItem.recipeName;

 

        existing.recipeCost =

            menuItem.recipeCost;

 

        existing.servings =

            menuItem.servings;

 

        existing.suggestedSellingPrice =

            menuItem.suggestedSellingPrice;

 

        existing.sellingPrice =

            menuItem.sellingPrice;

 

    } else {

 

        menu.items.push(menuItem);

    }

 

    saveAllData();

 

    showMessage(

        "menuMessage",

        recipe.name + " saved in Menu of the Day.",

        "success"

    );

}

 

 

/* =========================================================

   DAILY SALES

   SOLD OUT EXISTS ONLY HERE

========================================================= */

 

function getSavedDailySales(date) {

 

    return dailySalesRecords.find(

        function(record) {

            return record.date === date;

        }

    );

}

 

 

/* ---------------------------------------------------------

   CREATE A RELIABLE UNIQUE ROW ID

--------------------------------------------------------- */

 

function createSalesRowId() {

 

    return Date.now().toString() +

        "_" +

        Math.random()

            .toString(36)

            .substring(2, 8);

}

 

 

/* ---------------------------------------------------------

   GET COOKED FOOD ID

--------------------------------------------------------- */

 

function getCookedFoodKey(item) {

 

    if (item.menuItemId !== undefined &&

        item.menuItemId !== null &&

        item.menuItemId !== "") {

 

        return String(item.menuItemId);

    }

 

    if (item.recipeId !== undefined &&

        item.recipeId !== null &&

        item.recipeId !== "") {

 

        return String(item.recipeId);

    }

 

    if (item.id !== undefined &&

        item.id !== null &&

        item.id !== "") {

 

        return String(item.id);

    }

 

    return "";

}

 

 

/* ---------------------------------------------------------

   MAKE SURE OLD RECORDS HAVE ROW IDS

--------------------------------------------------------- */

 

function normalizeDailySalesRecords() {

 

    let changed = false;

 

    dailySalesRecords.forEach(

        function(record) {

 

            if (!Array.isArray(record.foodItems)) {

                record.foodItems = [];

                changed = true;

            }

 

            if (!Array.isArray(record.otherItems)) {

                record.otherItems = [];

                changed = true;

            }

 

            if (!Array.isArray(record.soldOutFoodIds)) {

                record.soldOutFoodIds = [];

                changed = true;

            }

 

            record.foodItems.forEach(

                function(item) {

 

                    if (!item.id) {

                        item.id = createSalesRowId();

                        changed = true;

                    }

 

                    if (!item.menuItemId) {

 

                        if (item.recipeId) {

                            item.menuItemId =

                                String(item.recipeId);

                        }

                    }

 

                    item.menuItemId =

                        String(

                            item.menuItemId || item.id

                        );

                }

            );

 

            record.otherItems.forEach(

                function(item) {

 

                    if (!item.id) {

                        item.id = createSalesRowId();

                        changed = true;

                    }

 

                    if (!item.otherItemId) {

 

                        if (item.itemId) {

                            item.otherItemId =

                                String(item.itemId);

                        }

                    }

 

                    item.otherItemId =

                        String(

                            item.otherItemId || item.id

                        );

                }

            );

 

            record.soldOutFoodIds =

                record.soldOutFoodIds.map(

                    function(id) {

                        return String(id);

                    }

                );

        }

    );

 

    if (changed) {

        saveAllData();

    }

}

 

 

/* ---------------------------------------------------------

   AVAILABLE COOKED FOOD

--------------------------------------------------------- */

 

function getAvailableSalesMenuItems(date) {

 

    const menu =

        getSavedMenuForDate(date);

 

    if (!menu ||

        !Array.isArray(menu.items)) {

 

        return [];

    }

 

    const record =

        getSavedDailySales(date);

 

    const soldOutIds =

        record &&

        Array.isArray(record.soldOutFoodIds)

 

            ? record.soldOutFoodIds.map(

                function(id) {

                    return String(id);

                }

            )

 

            : currentSalesSoldOutFoodIds.map(

                function(id) {

                    return String(id);

                }

            );

 

    const alreadyAdded = [];

 

    if (

        record &&

        Array.isArray(record.foodItems)

    ) {

 

        record.foodItems.forEach(

            function(item) {

 

                alreadyAdded.push(

                    getCookedFoodKey(item)

                );

            }

        );

    }

 

    return menu.items.filter(

        function(item) {

 

            const itemId =

                String(

                    item.recipeId ||

                    item.id ||

                    ""

                );

 

            if (!itemId) {

                return false;

            }

 

            /* SOLD OUT ITEMS NEVER RETURN */

            if (

                soldOutIds.indexOf(itemId) !== -1

            ) {

                return false;

            }

 

            /* ALREADY ADDED ITEMS NEVER RETURN */

            if (

                alreadyAdded.indexOf(itemId) !== -1

            ) {

                return false;

            }

 

            return true;

        }

    );

}

 

 

/* ---------------------------------------------------------

   LOAD DAILY SALES

--------------------------------------------------------- */

 

function loadDailySales() {

 

    normalizeDailySalesRecords();

 

    const dateInput =

        document.getElementById(

            "salesDate"

        );

 

    if (!dateInput) {

        return;

    }

 

    if (!dateInput.value) {

        dateInput.value = todayString();

    }

 

    const date =

        dateInput.value;

 

    const record =

        getSavedDailySales(date);

 

    currentSalesSoldOutFoodIds =

        record &&

        Array.isArray(record.soldOutFoodIds)

 

            ? record.soldOutFoodIds.map(

                function(id) {

                    return String(id);

                }

            )

 

            : [];

 

    renderSalesFoodDropdown(date);

    renderSalesOtherDropdown(date);

 

    renderSalesFoodItems(record);

    renderSalesOtherItems(record);

 

    calculateSalesTotals();

}

 

 

/* ---------------------------------------------------------

   COOKED FOOD DROPDOWN

--------------------------------------------------------- */

 

function renderSalesFoodDropdown(date) {

 

    const select =

        document.getElementById(

            "salesFoodSelect"

        );

 

    if (!select) {

        return;

    }

 

    select.innerHTML =

        '<option value="">Select cooked food...</option>';

 

    const items =

        getAvailableSalesMenuItems(date);

 

    items.forEach(

        function(item) {

 

            const option =

                document.createElement("option");

 

            option.value =

                String(item.recipeId);

 

            option.textContent =

                item.recipeName;

 

            select.appendChild(option);

        }

    );

}

 

 

/* ---------------------------------------------------------

   OTHER ITEM DROPDOWN

--------------------------------------------------------- */

 

function renderSalesOtherDropdown(date) {

 

    const select =

        document.getElementById(

            "salesOtherSelect"

        );

 

    if (!select) {

        return;

    }

 

    select.innerHTML =

        '<option value="">Select other item...</option>';

 

    otherItems.forEach(

        function(item) {

 

            const option =

                document.createElement("option");

 

            option.value =

                String(item.id);

 

            option.textContent =

                item.name;

 

            select.appendChild(option);

        }

    );

}

 

 

/* ---------------------------------------------------------

   ADD COOKED FOOD

--------------------------------------------------------- */

 

function addSalesFoodItem() {

 

    const select =

        document.getElementById(

            "salesFoodSelect"

        );

 

    if (!select) {

        return;

    }

 

    const id =

        String(select.value || "");

 

    if (!id) {

        return;

    }

 

    const date =

        document.getElementById(

            "salesDate"

        ).value;

 

    const menu =

        getSavedMenuForDate(date);

 

    if (!menu ||

        !Array.isArray(menu.items)) {

 

        return;

    }

 

    const menuItem =

        menu.items.find(

            function(item) {

 

                return String(

                    item.recipeId

                ) === id;

            }

        );

 

    if (!menuItem) {

        return;

    }

 

    let record =

        getSavedDailySales(date);

 

    if (!record) {

 

        record = {

            id: createSalesRowId(),

            date: date,

            foodItems: [],

            otherItems: [],

            foodSales: 0,

            otherSales: 0,

            totalSales: 0,

            foodCost: 0,

            otherCost: 0,

            totalCost: 0,

            grossProfit: 0,

            expenses: 0,

            profit: 0,

            soldOutFoodIds: []

        };

 

        dailySalesRecords.push(record);

    }

 

    if (!Array.isArray(record.foodItems)) {

        record.foodItems = [];

    }

 

    if (!Array.isArray(record.soldOutFoodIds)) {

        record.soldOutFoodIds = [];

    }

 

    /* Do not allow sold-out item to be added again */

 

    const isSoldOut =

        record.soldOutFoodIds

            .map(function(x) {

                return String(x);

            })

            .indexOf(id) !== -1;

 

    if (isSoldOut) {

 

        showMessage(

            "salesMessage",

            "This item is already marked Sold Out.",

            "error"

        );

 

        return;

    }

 

    const exists =

        record.foodItems.find(

            function(item) {

 

                return String(

                    item.menuItemId

                ) === id;

            }

        );

 

    if (!exists) {

 

        record.foodItems.push({

 

            id: createSalesRowId(),

 

            menuItemId: id,

 

            recipeName:

                menuItem.recipeName,

 

            quantitySold: 0,

 

            sellingPrice:

                numberValue(

                    menuItem.sellingPrice

                ),

 

            costPerServing:

                numberValue(

                    menuItem.recipeCost

                ) /

                Math.max(

                    1,

                    numberValue(

                        menuItem.servings

                    )

                )

        });

    }

 

    saveAllData();

 

    select.value = "";

 

    loadDailySales();

}

 

 

/* ---------------------------------------------------------

   RENDER COOKED FOOD ROWS

--------------------------------------------------------- */

 

function renderSalesFoodItems(record) {

 

    const container =

        document.getElementById(

            "salesFoodItems"

        );

 

    if (!container) {

        return;

    }

 

    container.innerHTML = "";

 

    if (

        !record ||

        !Array.isArray(record.foodItems) ||

        record.foodItems.length === 0

    ) {

 

        container.innerHTML =

            '<div class="empty">No cooked food added yet.</div>';

 

        return;

    }

 

    record.foodItems.forEach(

        function(item) {

 

            const itemId =

                getCookedFoodKey(item);

 

            const soldOut =

                currentSalesSoldOutFoodIds

                    .map(function(id) {

                        return String(id);

                    })

                    .indexOf(itemId) !== -1;

 

            const div =

                document.createElement("div");

 

            div.className =

                "sales-row" +

                (

                    soldOut

                        ? " sold-out"

                        : ""

                );

 

            /*

               Use the UNIQUE ROW ID for deletion.

               This fixes the first/second row deletion problem.

            */

 

            div.dataset.rowId =

                item.id;

 

            div.dataset.itemId =

                itemId;

 

            const quantity =

                numberValue(

                    item.quantitySold

                );

 

            const sales =

                quantity *

                numberValue(

                    item.sellingPrice

                );

 

            const cost =

                quantity *

                numberValue(

                    item.costPerServing

                );

 

            const profit =

                sales - cost;

 

            div.innerHTML =

 

                '<div class="sales-row-top">' +

 

                '<div class="sales-row-name">' +

                escapeHtml(

                    item.recipeName

                ) +

                (

                    soldOut

                        ? '<div class="sold-out-label">SOLD OUT</div>'

                        : ""

                ) +

                "</div>" +

 

                '<div class="button-row">' +

 

                (

                    soldOut

 

                        ? '<span style="font-size:10px;font-weight:700;color:#8b1e1e;">SOLD OUT</span>'

 

                        : '<button type="button" class="btn btn-secondary btn-small" onclick="markCookedFoodSoldOut(\'' +

                          itemId +

                          '\')">Sold Out</button>'

                ) +

 

                '<button type="button" class="btn btn-danger btn-small" onclick="deleteSalesFoodItem(\'' +

                item.id +

                '\')">Delete</button>' +

 

                "</div>" +

 

                "</div>" +

 

                '<div class="sales-grid">' +

 

                '<div class="sales-box">' +

                '<label>Quantity Sold</label>' +

                '<input type="number" class="sales-quantity" min="0" step="1" value="' +

                quantity +

                '" onchange="updateSalesFoodQuantity(this)">' +

                "</div>" +

 

                '<div class="sales-box">' +

                '<label>Selling Price</label>' +

                '<strong>' +

                money(item.sellingPrice) +

                "</strong>" +

                "</div>" +

 

                '<div class="sales-box">' +

                '<label>Cost / Serving</label>' +

                '<strong>' +

                money(item.costPerServing) +

                "</strong>" +

                "</div>" +

 

                '<div class="sales-box">' +

                '<label>Sales</label>' +

                '<strong class="row-sales">' +

                money(sales) +

                "</strong>" +

                "</div>" +

 

                '<div class="sales-box">' +

                '<label>Food Cost</label>' +

                '<strong class="row-cost">' +

                money(cost) +

                "</strong>" +

                "</div>" +

 

                '<div class="sales-box">' +

                '<label>Gross Profit</label>' +

                '<strong class="row-profit">' +

                money(profit) +

                "</strong>" +

                "</div>" +

 

                "</div>";

 

            container.appendChild(div);

        }

    );

}

 

 

/* ---------------------------------------------------------

   UPDATE COOKED FOOD QUANTITY

--------------------------------------------------------- */

 

function updateSalesFoodQuantity(input) {

 

    const row =

        input.closest(".sales-row");

 

    if (!row) {

        return;

    }

 

    const rowId =

        row.dataset.rowId;

 

    const date =

        document.getElementById(

            "salesDate"

        ).value;

 

    const record =

        getSavedDailySales(date);

 

    if (!record ||

        !Array.isArray(record.foodItems)) {

 

        return;

    }

 

    const item =

        record.foodItems.find(

            function(x) {

 

                return String(x.id) ===

                    String(rowId);

            }

        );

 

    if (!item) {

        return;

    }

 

    item.quantitySold =

        numberValue(input.value);

 

    const sales =

        item.quantitySold *

        numberValue(item.sellingPrice);

 

    const cost =

        item.quantitySold *

        numberValue(item.costPerServing);

 

    const profit =

        sales - cost;

 

    row.querySelector(

        ".row-sales"

    ).textContent =

        money(sales);

 

    row.querySelector(

        ".row-cost"

    ).textContent =

        money(cost);

 

    row.querySelector(

        ".row-profit"

    ).textContent =

        money(profit);

 

    saveAllData();

 

    calculateSalesTotals();

}

 

 

/* ---------------------------------------------------------

   MARK COOKED FOOD SOLD OUT

--------------------------------------------------------- */

 

function markCookedFoodSoldOut(id) {

 

    id = String(id);

 

    if (

        currentSalesSoldOutFoodIds

            .map(function(x) {

                return String(x);

            })

            .indexOf(id) === -1

    ) {

 

        currentSalesSoldOutFoodIds.push(id);

    }

 

    const date =

        document.getElementById(

            "salesDate"

        ).value;

 

    let record =

        getSavedDailySales(date);

 

    if (!record) {

 

        record = {

 

            id: createSalesRowId(),

 

            date: date,

 

            foodItems: [],

 

            otherItems: [],

 

            foodSales: 0,

 

            otherSales: 0,

 

            totalSales: 0,

 

            foodCost: 0,

 

            otherCost: 0,

 

            totalCost: 0,

 

            grossProfit: 0,

 

            expenses: 0,

 

            profit: 0,

 

            soldOutFoodIds:

                currentSalesSoldOutFoodIds.slice()

        };

 

        dailySalesRecords.push(record);

 

    } else {

 

        if (!Array.isArray(record.soldOutFoodIds)) {

            record.soldOutFoodIds = [];

        }

 

        record.soldOutFoodIds =

            currentSalesSoldOutFoodIds.slice();

    }

 

    saveAllData();

 

    showMessage(

        "salesMessage",

        "Item marked as Sold Out. It is removed from the selection list.",

        "success"

    );

 

    loadDailySales();

}

 

 

/* ---------------------------------------------------------

   DELETE COOKED FOOD

   DELETE BY UNIQUE ROW ID

--------------------------------------------------------- */

 

function deleteSalesFoodItem(rowId) {

 

    const date =

        document.getElementById(

            "salesDate"

        ).value;

 

    const record =

        getSavedDailySales(date);

 

    if (!record ||

        !Array.isArray(record.foodItems)) {

 

        return;

    }

 

    record.foodItems =

        record.foodItems.filter(

            function(item) {

 

                return String(item.id) !==

                    String(rowId);

            }

        );

 

    saveAllData();

 

    loadDailySales();

}

 

 

/* ---------------------------------------------------------

   ADD OTHER ITEM

--------------------------------------------------------- */

 

function addSalesOtherItem() {

 

    const select =

        document.getElementById(

            "salesOtherSelect"

        );

 

    if (!select) {

        return;

    }

 

    const id =

        String(select.value || "");

 

    if (!id) {

        return;

    }

 

    const item =

        otherItems.find(

            function(x) {

 

                return String(x.id) === id;

            }

        );

 

    if (!item) {

        return;

    }

 

    const date =

        document.getElementById(

            "salesDate"

        ).value;

 

    let record =

        getSavedDailySales(date);

 

    if (!record) {

 

        record = {

 

            id: createSalesRowId(),

 

            date: date,

 

            foodItems: [],

 

            otherItems: [],

 

            foodSales: 0,

 

            otherSales: 0,

 

            totalSales: 0,

 

            foodCost: 0,

 

            otherCost: 0,

 

            totalCost: 0,

 

            grossProfit: 0,

 

            expenses: 0,

 

            profit: 0,

 

            soldOutFoodIds: []

        };

 

        dailySalesRecords.push(record);

    }

 

    if (!Array.isArray(record.otherItems)) {

        record.otherItems = [];

    }

 

    const exists =

        record.otherItems.find(

            function(x) {

 

                return String(

                    x.otherItemId

                ) === id;

            }

        );

 

    if (!exists) {

 

        record.otherItems.push({

 

            id: createSalesRowId(),

 

            otherItemId: id,

 

            name: item.name,

 

            quantitySold: 0,

 

            sellingPrice:

                numberValue(

                    item.sellingPrice

                ),

 

            unitCost:

                numberValue(

                    item.unitCost

                )

        });

    }

 

    saveAllData();

 

    select.value = "";

 

    loadDailySales();

}

 

 

/* ---------------------------------------------------------

   RENDER OTHER ITEMS

--------------------------------------------------------- */

 

function renderSalesOtherItems(record) {

 

    const container =

        document.getElementById(

            "salesOtherItems"

        );

 

    if (!container) {

        return;

    }

 

    container.innerHTML = "";

 

    if (

        !record ||

        !Array.isArray(record.otherItems) ||

        record.otherItems.length === 0

    ) {

 

        container.innerHTML =

            '<div class="empty">No other items added yet.</div>';

 

        return;

    }

 

    record.otherItems.forEach(

        function(item) {

 

            const div =

                document.createElement("div");

 

            div.className =

                "sales-row";

 

            div.dataset.rowId =

                item.id;

 

            div.dataset.itemId =

                String(item.otherItemId);

 

            const quantity =

                numberValue(

                    item.quantitySold

                );

 

            const sales =

                quantity *

                numberValue(

                    item.sellingPrice

                );

 

            const cost =

                quantity *

                numberValue(

                    item.unitCost

                );

 

            const profit =

                sales - cost;

 

            div.innerHTML =

 

                '<div class="sales-row-top">' +

 

                '<div class="sales-row-name">' +

                escapeHtml(item.name) +

                "</div>" +

 

                '<button type="button" class="btn btn-danger btn-small" onclick="deleteSalesOtherItem(\'' +

                item.id +

                '\')">Delete</button>' +

 

                "</div>" +

 

                '<div class="sales-grid">' +

 

                '<div class="sales-box">' +

                '<label>Quantity Sold</label>' +

                '<input type="number" class="sales-quantity" min="0" step="1" value="' +

                quantity +

                '" onchange="updateSalesOtherQuantity(this)">' +

                "</div>" +

 

                '<div class="sales-box">' +

                '<label>Selling Price</label>' +

                '<strong>' +

                money(item.sellingPrice) +

                "</strong>" +

                "</div>" +

 

                '<div class="sales-box">' +

                '<label>Unit Cost</label>' +

                '<strong>' +

                money(item.unitCost) +

                "</strong>" +

                "</div>" +

 

                '<div class="sales-box">' +

                '<label>Sales</label>' +

                '<strong class="row-sales">' +

                money(sales) +

                "</strong>" +

                "</div>" +

 

                '<div class="sales-box">' +

                '<label>Cost</label>' +

                '<strong class="row-cost">' +

                money(cost) +

                "</strong>" +

                "</div>" +

 

                '<div class="sales-box">' +

                '<label>Profit</label>' +

                '<strong class="row-profit">' +

                money(profit) +

                "</strong>" +

 

                "</div>" +

 

                "</div>";

 

            container.appendChild(div);

        }

    );

}

 

 

/* ---------------------------------------------------------

   UPDATE OTHER ITEM QUANTITY

--------------------------------------------------------- */

 

function updateSalesOtherQuantity(input) {

 

    const row =

        input.closest(".sales-row");

 

    if (!row) {

        return;

    }

 

    const rowId =

        row.dataset.rowId;

 

    const date =

        document.getElementById(

            "salesDate"

        ).value;

 

    const record =

        getSavedDailySales(date);

 

    if (!record ||

        !Array.isArray(record.otherItems)) {

 

        return;

    }

 

    const item =

        record.otherItems.find(

            function(x) {

 

                return String(x.id) ===

                    String(rowId);

            }

        );

 

    if (!item) {

        return;

    }

 

    item.quantitySold =

        numberValue(input.value);

 

    const sales =

        item.quantitySold *

        numberValue(item.sellingPrice);

 

    const cost =

        item.quantitySold *

        numberValue(item.unitCost);

 

    const profit =

        sales - cost;

 

    row.querySelector(

        ".row-sales"

    ).textContent =

        money(sales);

 

    row.querySelector(

        ".row-cost"

    ).textContent =

        money(cost);

 

    row.querySelector(

        ".row-profit"

    ).textContent =

        money(profit);

 

    saveAllData();

 

    calculateSalesTotals();

}

 

 

/* ---------------------------------------------------------

   DELETE OTHER ITEM

   DELETE BY UNIQUE ROW ID

--------------------------------------------------------- */

 

function deleteSalesOtherItem(rowId) {

 

    const date =

        document.getElementById(

            "salesDate"

        ).value;

 

    const record =

        getSavedDailySales(date);

 

    if (!record ||

        !Array.isArray(record.otherItems)) {

 

        return;

    }

 

    record.otherItems =

        record.otherItems.filter(

            function(item) {

 

                return String(item.id) !==

                    String(rowId);

            }

        );

 

    saveAllData();

 

    loadDailySales();

}

 

 

/* ---------------------------------------------------------

   CALCULATE DAILY SALES TOTALS

--------------------------------------------------------- */

 

function calculateSalesTotals() {

 

    const date =

        document.getElementById(

            "salesDate"

        ).value;

 

    const record =

        getSavedDailySales(date);

 

    let foodSales = 0;

    let otherSales = 0;

    let foodCost = 0;

    let otherCost = 0;

 

    if (record) {

 

        if (Array.isArray(record.foodItems)) {

 

            record.foodItems.forEach(

                function(item) {

 

                    foodSales +=

                        numberValue(

                            item.quantitySold

                        ) *

                        numberValue(

                            item.sellingPrice

                        );

 

                    foodCost +=

                        numberValue(

                            item.quantitySold

                        ) *

                        numberValue(

                            item.costPerServing

                        );

                }

            );

        }

 

        if (Array.isArray(record.otherItems)) {

 

            record.otherItems.forEach(

                function(item) {

 

                    otherSales +=

                        numberValue(

                            item.quantitySold

                        ) *

                        numberValue(

                            item.sellingPrice

                        );

 

                    otherCost +=

                        numberValue(

                            item.quantitySold

                        ) *

                        numberValue(

                            item.unitCost

                        );

                }

            );

        }

 

        record.foodSales =

            foodSales;

 

        record.otherSales =

            otherSales;

 

        record.totalSales =

            foodSales + otherSales;

 

        record.foodCost =

            foodCost;

 

        record.otherCost =

            otherCost;

 

        record.totalCost =

            foodCost + otherCost;

 

        record.grossProfit =

            record.totalSales -

            record.totalCost;

 

        record.profit =

            record.grossProfit;

    }

 

    const foodTotal =

        document.getElementById(

            "salesFoodTotal"

        );

 

    if (foodTotal) {

        foodTotal.textContent =

            money(foodSales);

    }

 

    const otherTotal =

        document.getElementById(

            "salesOtherTotal"

        );

 

    if (otherTotal) {

        otherTotal.textContent =

            money(otherSales);

    }

 

    const grandTotal =

        document.getElementById(

            "salesGrandTotal"

        );

 

    if (grandTotal) {

        grandTotal.textContent =

            money(

                foodSales +

                otherSales

            );

    }

 

    const costTotal =

        document.getElementById(

            "salesCostTotal"

        );

 

    if (costTotal) {

        costTotal.textContent =

            money(

                foodCost +

                otherCost

            );

    }

 

    const grossProfit =

        document.getElementById(

            "salesGrossProfit"

        );

 

    if (grossProfit) {

        grossProfit.textContent =

            money(

                foodSales +

                otherSales -

                foodCost -

                otherCost

            );

    }

 

    saveAllData();

}

 

 

/* ---------------------------------------------------------

   SAVE DAILY SALES

--------------------------------------------------------- */

 

function saveDailySales() {

 

    const date =

        document.getElementById(

            "salesDate"

        ).value;

 

    if (!date) {

        return;

    }

 

    let record =

        getSavedDailySales(date);

 

    if (!record) {

 

        record = {

 

            id: createSalesRowId(),

 

            date: date,

 

            foodItems: [],

 

            otherItems: [],

 

            foodSales: 0,

 

            otherSales: 0,

 

            totalSales: 0,

 

            foodCost: 0,

 

            otherCost: 0,

 

            totalCost: 0,

 

            grossProfit: 0,

 

            expenses: 0,

 

            profit: 0,

 

            soldOutFoodIds:

                currentSalesSoldOutFoodIds.slice()

        };

 

        dailySalesRecords.push(record);

    }

 

    if (!Array.isArray(record.soldOutFoodIds)) {

        record.soldOutFoodIds = [];

    }

 

    record.soldOutFoodIds =

        currentSalesSoldOutFoodIds.slice();

 

    calculateSalesTotals();

 

    saveAllData();

 

    showMessage(

        "salesMessage",

        "Daily Sales record saved successfully.",

        "success"

    );

 

    updateDashboard();

}

 

 

/* =========================================================

   PROFIT CALCULATOR

========================================================= */

 

function getPreviousProfitRecord(date) {

 

    const sorted =

        profitRecords

            .filter(function(record) {

                return record.date < date;

            })

            .sort(function(a,b) {

                return b.date.localeCompare(a.date);

            });

 

    return sorted.length > 0

        ? sorted[0]

        : null;

}

 

 

function loadProfitCalculator() {

 

    const dateInput =

        document.getElementById(

            "profitDate"

        );

 

    if (!dateInput.value) {

        dateInput.value = todayString();

    }

 

    const date =

        dateInput.value;

 

    const sales =

        getSavedDailySales(date);

 

    const existing =

        profitRecords.find(

            function(record) {

                return record.date === date;

            }

        );

 

    const previous =

        getPreviousProfitRecord(date);

 

    const foodSales =

        sales

            ? numberValue(sales.foodSales)

            : 0;

 

    const otherSales =

        sales

            ? numberValue(sales.otherSales)

            : 0;

 

    const foodCost =

        sales

            ? numberValue(sales.foodCost)

            : 0;

 

    const otherCost =

        sales

            ? numberValue(sales.otherCost)

            : 0;

 

    document.getElementById(

        "profitFoodSales"

    ).textContent = money(foodSales);

 

    document.getElementById(

        "profitOtherSales"

    ).textContent = money(otherSales);

 

    document.getElementById(

        "profitTotalSales"

    ).textContent =

        money(foodSales + otherSales);

 

    document.getElementById(

        "profitFoodCost"

    ).textContent = money(foodCost);

 

    document.getElementById(

        "profitOtherCost"

    ).textContent = money(otherCost);

 

    document.getElementById(

        "profitTotalCost"

    ).textContent =

        money(foodCost + otherCost);

 

    document.getElementById(

        "profitGrossProfit"

    ).textContent =

        money(

            foodSales +

            otherSales -

            foodCost -

            otherCost

        );

 

    let expenses = {

        rent: 0,

        gas: 0,

        electricity: 0,

        water: 0,

        wifi: 0,

        labor: 0,

        other: 0

    };

 

    if (existing && existing.expenses) {

 

        expenses = {

            rent: numberValue(existing.expenses.rent),

            gas: numberValue(existing.expenses.gas),

            electricity: numberValue(existing.expenses.electricity),

            water: numberValue(existing.expenses.water),

            wifi: numberValue(existing.expenses.wifi),

            labor: numberValue(existing.expenses.labor),

            other: numberValue(existing.expenses.other)

        };

 

    } else if (previous && previous.expenses) {

 

        expenses = {

            rent: numberValue(previous.expenses.rent),

            gas: numberValue(previous.expenses.gas),

            electricity: numberValue(previous.expenses.electricity),

            water: numberValue(previous.expenses.water),

            wifi: numberValue(previous.expenses.wifi),

            labor: numberValue(previous.expenses.labor),

            other: numberValue(previous.expenses.other)

        };

    }

 

    document.getElementById(

        "expenseRent"

    ).value = expenses.rent;

 

    document.getElementById(

        "expenseGas"

    ).value = expenses.gas;

 

    document.getElementById(

        "expenseElectricity"

    ).value = expenses.electricity;

 

    document.getElementById(

        "expenseWater"

    ).value = expenses.water;

 

    document.getElementById(

        "expenseWifi"

    ).value = expenses.wifi;

 

    document.getElementById(

        "expenseLabor"

    ).value = expenses.labor;

 

    document.getElementById(

        "expenseOther"

    ).value = expenses.other;

 

    calculateProfit();

}

 

 

function calculateProfit() {

 

    const foodSales =

        numberValue(

            document.getElementById(

                "profitFoodSales"

            ).textContent.replace(/[₱,]/g, "")

        );

 

    const otherSales =

        numberValue(

            document.getElementById(

                "profitOtherSales"

            ).textContent.replace(/[₱,]/g, "")

        );

 

    const foodCost =

        numberValue(

            document.getElementById(

                "profitFoodCost"

            ).textContent.replace(/[₱,]/g, "")

        );

 

    const otherCost =

        numberValue(

            document.getElementById(

                "profitOtherCost"

            ).textContent.replace(/[₱,]/g, "")

        );

 

    const totalSales =

        foodSales + otherSales;

 

    const totalCost =

        foodCost + otherCost;

 

    const grossProfit =

        totalSales - totalCost;

 

    const expenses =

 

        numberValue(

            document.getElementById(

                "expenseRent"

            ).value

        ) +

 

        numberValue(

            document.getElementById(

                "expenseGas"

            ).value

        ) +

 

        numberValue(

            document.getElementById(

                "expenseElectricity"

            ).value

        ) +

 

        numberValue(

            document.getElementById(

                "expenseWater"

            ).value

        ) +

 

        numberValue(

            document.getElementById(

                "expenseWifi"

            ).value

        ) +

 

        numberValue(

            document.getElementById(

                "expenseLabor"

            ).value

        ) +

 

        numberValue(

            document.getElementById(

                "expenseOther"

            ).value

        );

 

    const netProfit =

        grossProfit - expenses;

 

    document.getElementById(

        "profitNetProfit"

    ).textContent =

        money(netProfit);

 

    return {

        foodSales: foodSales,

        otherSales: otherSales,

        totalSales: totalSales,

        foodCost: foodCost,

        otherCost: otherCost,

        totalCost: totalCost,

        grossProfit: grossProfit,

        expenses: expenses,

        netProfit: netProfit

    };

}

 

 

function saveProfitRecord() {

 

    const date =

        document.getElementById(

            "profitDate"

        ).value;

 

    if (!date) {

        return;

    }

 

    const result =

        calculateProfit();

 

    const expenses = {

 

        rent:

            numberValue(

                document.getElementById(

                    "expenseRent"

                ).value

            ),

 

        gas:

            numberValue(

                document.getElementById(

                    "expenseGas"

                ).value

            ),

 

        electricity:

            numberValue(

                document.getElementById(

                    "expenseElectricity"

                ).value

            ),

 

        water:

            numberValue(

                document.getElementById(

                    "expenseWater"

                ).value

            ),

 

        wifi:

            numberValue(

                document.getElementById(

                    "expenseWifi"

                ).value

            ),

 

        labor:

            numberValue(

                document.getElementById(

                    "expenseLabor"

                ).value

            ),

 

        other:

            numberValue(

                document.getElementById(

                    "expenseOther"

                ).value

            )

    };

 

    const record = {

 

        id: Date.now().toString(),

 

        date: date,

 

        foodSales:

            result.foodSales,

 

        otherSales:

            result.otherSales,

 

        totalSales:

            result.totalSales,

 

        foodCost:

            result.foodCost,

 

        otherCost:

            result.otherCost,

 

        totalCost:

            result.totalCost,

 

        grossProfit:

            result.grossProfit,

 

        expenses:

            expenses,

 

        totalExpenses:

            result.expenses,

 

        netProfit:

            result.netProfit

    };

 

    const existingIndex =

        profitRecords.findIndex(

            function(item) {

                return item.date === date;

            }

        );

 

    if (existingIndex >= 0) {

 

        record.id =

            profitRecords[

                existingIndex

            ].id;

 

        profitRecords[

            existingIndex

        ] = record;

 

    } else {

 

        profitRecords.push(record);

    }

 

    saveAllData();

 

    showMessage(

        "profitMessage",

        "Profit Calculator record saved successfully.",

        "success"

    );

 

    updateDashboard();

}

 

 

/* =========================================================

   DASHBOARD

========================================================= */

 

function updateDashboard() {

 

    const today =

        todayString();

 

    const sales =

        getSavedDailySales(today);

 

    const profit =

        profitRecords.find(

            function(record) {

                return record.date === today;

            }

        );

 

    const totalSales =

        sales

            ? numberValue(sales.totalSales)

            : 0;

 

    const expenses =

        profit

            ? numberValue(profit.totalExpenses)

            : 0;

 

    const netProfit =

        profit

            ? numberValue(profit.netProfit)

            : (

                sales

                    ? numberValue(sales.grossProfit)

                    : 0

            );

 

    document.getElementById(

        "todaySales"

    ).textContent =

        money(totalSales);

 

    document.getElementById(

        "todayExpenses"

    ).textContent =

        money(expenses);

 

    document.getElementById(

        "todayProfit"

    ).textContent =

        money(netProfit);

 

    updateMonthlySummary();

}

 

 

function updateMonthlySummary() {

 

    const now =

        new Date();

 

    const year =

        now.getFullYear();

 

    const month =

        String(

            now.getMonth() + 1

        ).padStart(2, "0");

 

    const prefix =

        year + "-" + month;

 

    let sales = 0;

    let expenses = 0;

    let profit = 0;

 

    dailySalesRecords.forEach(

        function(record) {

 

            if (

                record.date &&

                record.date.indexOf(prefix) === 0

            ) {

 

                sales +=

                    numberValue(

                        record.totalSales

                    );

            }

        }

    );

 

    profitRecords.forEach(

        function(record) {

 

            if (

                record.date &&

                record.date.indexOf(prefix) === 0

            ) {

 

                expenses +=

                    numberValue(

                        record.totalExpenses

                    );

 

                profit +=

                    numberValue(

                        record.netProfit

                    );

            }

        }

    );

 

    /*

       If a daily sales record has no corresponding

       profit record, include its gross profit.

    */

 

    dailySalesRecords.forEach(

        function(record) {

 

            if (

                record.date &&

                record.date.indexOf(prefix) === 0

            ) {

 

                const hasProfit =

                    profitRecords.some(

                        function(p) {

                            return p.date === record.date;

                        }

                    );

 

                if (!hasProfit) {

 

                    profit +=

                        numberValue(

                            record.grossProfit

                        );

                }

            }

        }

    );

 

    const monthName =

        now.toLocaleString(

            "en-US",

            {

                month: "long",

                year: "numeric"

            }

        );

 

    document.getElementById(

        "monthlySummaryLabel"

    ).textContent =

        monthName;

 

    document.getElementById(

        "monthlySales"

    ).textContent =

        money(sales);

 

    document.getElementById(

        "monthlyExpenses"

    ).textContent =

        money(expenses);

 

    document.getElementById(

        "monthlyProfit"

    ).textContent =

        money(profit);

}

 

 

/* =========================================================

   RECORDS - MONTHLY ARCHIVE

========================================================= */

 

function getMonthName(dateString) {

 

    const parts =

        dateString.split("-");

 

    if (parts.length !== 3) {

        return "Unknown Month";

    }

 

    const date =

        new Date(

            Number(parts[0]),

            Number(parts[1]) - 1,

            1

        );

 

    return date.toLocaleString(

        "en-US",

        {

            month: "long",

            year: "numeric"

        }

    );

}

 

 

function renderMonthlyRecords() {

 

    const container =

        document.getElementById(

            "monthlyRecords"

        );

 

    const dates = [];

 

    dailySalesRecords.forEach(

        function(record) {

 

            if (

                record.date &&

                dates.indexOf(record.date) === -1

            ) {

                dates.push(record.date);

            }

        }

    );

 

    profitRecords.forEach(

        function(record) {

 

            if (

                record.date &&

                dates.indexOf(record.date) === -1

            ) {

                dates.push(record.date);

            }

        }

    );

 

    if (dates.length === 0) {

 

        container.innerHTML =

            '<div class="empty">No saved records yet.</div>';

 

        return;

    }

 

    const months = {};

 

    dates.forEach(function(date) {

 

        const key =

            date.substring(0,7);

 

        if (!months[key]) {

            months[key] = [];

        }

 

        months[key].push(date);

    });

 

    const sortedMonths =

        Object.keys(months).sort().reverse();

 

    container.innerHTML = "";

 

    sortedMonths.forEach(

        function(monthKey, index) {

 

            const datesInMonth =

                months[monthKey].sort().reverse();

 

            const folder =

                document.createElement("div");

 

            folder.className =

                "month-folder";

 

            const header =

                document.createElement("button");

 

            header.className =

                "month-header";

 

            header.textContent =

                getMonthName(

                    datesInMonth[0]

                );

 

            const content =

                document.createElement("div");

 

            content.className =

                "month-content";

 

            content.style.display =

                index === 0

                    ? "block"

                    : "none";

 

            header.onclick =

                function() {

 

                    if (

                        content.style.display ===

                        "none"

                    ) {

                        content.style.display =

                            "block";

                    } else {

                        content.style.display =

                            "none";

                    }

                };

 

            datesInMonth.forEach(

                function(date) {

 

                    const salesRecord =

                        getSavedDailySales(date);

 

                    const profitRecord =

                        profitRecords.find(

                            function(record) {

                                return record.date === date;

                            }

                        );

 

                    if (salesRecord) {

 

                        const card =

                            document.createElement("div");

 

                        card.className =

                            "record-card";

 

                        card.innerHTML =

                            "<strong>" +

                            date +

                            "</strong><br>" +

                            "Daily Sales Monitoring<br>" +

                            "Sales: " +

                            money(

                                salesRecord.totalSales

                            ) +

                            " | Gross Profit: " +

                            money(

                                salesRecord.grossProfit

                            );

 

                        content.appendChild(card);

                    }

 

                    if (profitRecord) {

 

                        const card =

                            document.createElement("div");

 

                        card.className =

                            "record-card";

 

                        card.innerHTML =

                            "<strong>" +

                            date +

                            "</strong><br>" +

                            "Profit Calculator<br>" +

                            "Sales: " +

                            money(

                                profitRecord.totalSales

                            ) +

                            " | Expenses: " +

                            money(

                                profitRecord.totalExpenses

                            ) +

                            " | Net Profit: " +

                            money(

                                profitRecord.netProfit

                            );

 

                        content.appendChild(card);

                    }

                }

            );

 

            folder.appendChild(header);

            folder.appendChild(content);

 

            container.appendChild(folder);

        }

    );

}

 

 

/* =========================================================

   MESSAGES

========================================================= */

 

function showMessage(

    elementId,

    message,

    type

) {

 

    const element =

        document.getElementById(

            elementId

        );

 

    if (!element) {

        return;

    }

 

    element.textContent = message;

 

    element.className =

        "message show " +

        type;

 

    setTimeout(

        function() {

            element.classList.remove("show");

        },

        3000

    );

}

 

 

/* =========================================================

   INITIALIZATION

========================================================= */

 

async function initializeUserData() {

    const { data, error } =

        await supabaseClient.auth.getUser();

 

    if (error || !data.user) {

        currentUserId = null;

        userDataLoaded = false;

        return;

    }

 

    loadUserScopedData(data.user.id);

 

    await renderIngredientList();

    await renderOtherItemList();

 

    updateDashboard();

}

 

 

document.addEventListener(

    "DOMContentLoaded",

    async function() {

 

        populateMasterIngredientSelect();

        populateMasterOtherItemSelect();

 

        const recipeDate =

            document.getElementById("recipeDate");

 

        if (recipeDate) {

            recipeDate.value = todayString();

        }

 

        const savedRecipeDate =

            document.getElementById("savedRecipeDate");

 

        if (savedRecipeDate) {

            savedRecipeDate.value = todayString();

        }

 

        const menuDate =

            document.getElementById("menuDate");

 

        if (menuDate) {

            menuDate.value = todayString();

        }

 

        const salesDate =

            document.getElementById("salesDate");

 

        if (salesDate) {

            salesDate.value = todayString();

        }

 

        const profitDate =

            document.getElementById("profitDate");

 

        if (profitDate) {

            profitDate.value = todayString();

        }

 

        const targetInput =

            document.getElementById("targetFoodCost");

 

        if (targetInput) {

            targetInput.value = targetFoodCost;

        }

 

        const { data } =

            await supabaseClient.auth.getSession();

 

        if (data.session) {

            await initializeUserData();

        }

 

        await updateAppAccess();

    }

);

 

 

/* =========================================================

   MOBILE APP / SERVICE WORKER

========================================================= */

 

if ("serviceWorker" in navigator) {

 

    window.addEventListener("load", function() {

 

        navigator.serviceWorker

            .register("./service-worker.js")

            .then(function() {

                console.log("Karinderya Kalkulator app is ready.");

            })

            .catch(function(error) {

                console.log(

                    "Service worker registration failed:",

                    error

                );

            });

 

    });

 

}

 

 

/* =========================================================

   AUTHENTICATION

========================================================= */

 

document.getElementById("signupBtn").addEventListener("click", async function () {

    const email = document.getElementById("authEmail").value.trim();

    const password = document.getElementById("authPassword").value;

 

    const { data, error } =

        await supabaseClient.auth.signUp({

            email: email,

            password: password

        });

 

    if (error) {

        document.getElementById("authMessage").textContent =

            error.message;

        return;

    }

 

    document.getElementById("authMessage").textContent =

        "Account created. Please check your email if confirmation is required.";

});

 

 

document.getElementById("loginBtn").addEventListener("click", async function () {

    const email = document.getElementById("authEmail").value.trim();

    const password = document.getElementById("authPassword").value;

 

    const { data, error } =

        await supabaseClient.auth.signInWithPassword({

            email: email,

            password: password

        });

 

    if (error) {

        document.getElementById("authMessage").textContent =

            error.message;

        return;

    }

 

    await initializeUserData();

 

    document.getElementById("authMessage").textContent =

        "Login successful.";

});

 

 

document.getElementById("forgotPasswordBtn").addEventListener("click", async function () {

 

    const email =

        document.getElementById("authEmail").value.trim();

 

    if (!email) {

        document.getElementById("authMessage").textContent =

            "Please enter your email address first.";

        return;

    }

 

    const { error } =

        await supabaseClient.auth.resetPasswordForEmail(

            email,

            {

                redirectTo:

                    "https://aj1716-qa.github.io/karinderya-kalkulator/"

            }

        );

 

    if (error) {

        document.getElementById("authMessage").textContent =

            error.message;

        return;

    }

 

    document.getElementById("authMessage").textContent =

        "Password reset email sent. Please check your email.";

});

 

 

document.getElementById("logoutBtn").addEventListener("click", async function () {

 

    const { error } =

        await supabaseClient.auth.signOut();

 

    if (error) {

        document.getElementById("authMessage").textContent =

            error.message;

        return;

    }

 

    currentUserId = null;

    userDataLoaded = false;

 

    savedRecipes = [];

    savedMenus = [];

    ingredientPrices = [];

    otherItems = [];

    dailySalesRecords = [];

    profitRecords = [];

    targetFoodCost = 40;

 

    document.getElementById("authMessage").textContent =

        "You have been logged out.";

});

 

 

async function updateAppAccess() {

 

    const authScreen =

        document.getElementById("authScreen");

 

    const appContainer =

        document.getElementById("appContent");

 

    const { data } =

        await supabaseClient.auth.getSession();

 

    if (data.session) {

 

        authScreen.style.display = "none";

        appContainer.style.display = "block";

 

    } else {

 

        authScreen.style.display = "block";

        appContainer.style.display = "none";

    }

}

 

 

supabaseClient.auth.onAuthStateChange(

    async function(event, session) {

 

        if (session) {

            loadUserScopedData(session.user.id);

 

            /*

               Supabase auth callbacks can occur while the page is

               still settling. Refresh cloud master data here so

               the new account gets its own ingredients/items.

            */

            await renderIngredientList();

            await renderOtherItemList();

            updateDashboard();

 

        } else {

 

            currentUserId = null;

            userDataLoaded = false;

 

            savedRecipes = [];

            savedMenus = [];

            ingredientPrices = [];

            otherItems = [];

            dailySalesRecords = [];

            profitRecords = [];

            targetFoodCost = 40;

            currentSalesSoldOutFoodIds = [];

        }

 

        await updateAppAccess();

    }

);

 

 

async function getCurrentUserId() {

 

    if (currentUserId) {

        return currentUserId;

    }

 

    const { data, error } =

        await supabaseClient.auth.getUser();

 

    if (error || !data.user) {

        return null;

    }

 

    currentUserId = data.user.id;

 

    return currentUserId;

}

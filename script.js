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

    ingredientPrices =
        ingredientPrices.filter(function(item) {
            return String(item.id) !== String(id);
        });

    await renderIngredientList();

    populateMasterIngredientSelect();

    refreshRecipeIngredientDropdowns();

    showMessage(
        "ingredientMessage",
        "Ingredient deleted successfully.",
        "success"
    );
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
                "otherItemPurchasePrice"
            ).value
        );

    const quantity =
        numberValue(
            document.getElementById(
                "otherItemQuantity"
            ).value
        );

    const unit =
        document.getElementById(
            "otherItemUnit"
        ).value;

    const sellingPrice =
        numberValue(
            document.getElementById(
                "otherItemSellingPrice"
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
            "Please enter valid price, quantity, and selling price.",
            "error"
        );

        return;
    }

    const unitCost =
        purchasePrice / quantity;

    const userId =
        await getCurrentUserId();

    if (!userId) {
        return;
    }

    const { data, error } =
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
            })
            .select()
            .single();

    if (error) {

        console.error(
            "Supabase other item save error:",
            error
        );

        showMessage(
            "otherItemMessage",
            "Unable to save other item.",
            "error"
        );

        return;
    }

    if (data) {

        otherItems.push({
            id: String(data.id),
            name: data.name,
            purchasePrice:
                numberValue(data.purchase_price),
            quantity:
                numberValue(data.quantity),
            unit: data.unit || "",
            unitCost:
                numberValue(data.unit_cost),
            sellingPrice:
                numberValue(data.selling_price)
        });
    }

    showMessage(
        "otherItemMessage",
        "Other item saved successfully.",
        "success"
    );

    document.getElementById(
        "otherItemName"
    ).value = "";

    document.getElementById(
        "customOtherItemName"
    ).value = "";

    document.getElementById(
        "otherItemPurchasePrice"
    ).value = "";

    document.getElementById(
        "otherItemQuantity"
    ).value = "";

    document.getElementById(
        "otherItemSellingPrice"
    ).value = "";

    handleCustomOtherItem();

    renderOtherItemList();
}


async function renderOtherItemList() {

    const container =
        document.getElementById(
            "otherItemList"
        );

    if (!container) {
        return;
    }

    const userId =
        await getCurrentUserId();

    if (!userId) {

        container.innerHTML =
            '<div class="empty">Please log in to view saved other items.</div>';

        return;
    }

    const { data, error } =
        await supabaseClient
            .from("other_items")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", {
                ascending: false
            });

    if (error) {

        console.error(
            "Supabase other items load error:",
            error
        );

        container.innerHTML =
            '<div class="empty">Unable to load saved other items.</div>';

        return;
    }

    otherItems =
        (data || []).map(function(item) {

            return {
                id: String(item.id),
                name: item.name,
                purchasePrice:
                    numberValue(item.purchase_price),
                quantity:
                    numberValue(item.quantity),
                unit:
                    item.unit || "",
                unitCost:
                    numberValue(item.unit_cost),
                sellingPrice:
                    numberValue(item.selling_price)
            };
        });

    if (otherItems.length === 0) {

        container.innerHTML =
            '<div class="empty">No other items saved yet.</div>';

        return;
    }

    container.innerHTML = "";

    otherItems.forEach(function(item) {

        const div =
            document.createElement("div");

        div.className =
            "list-item";

        div.innerHTML =
            '<div class="list-item-title">' +
            escapeHtml(item.name) +
            "</div>" +

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
            "</div>" +

            '<div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap;">' +

            '<button class="btn btn-secondary btn-small" onclick="editOtherItem(\'' +
            item.id +
            '\')">Edit</button>' +

            '<button class="btn btn-danger btn-small" onclick="deleteOtherItem(\'' +
            item.id +
            '\')">Delete</button>' +

            "</div>";

        container.appendChild(div);
    });
}


async function editOtherItem(id) {

    const item =
        otherItems.find(function(x) {
            return String(x.id) === String(id);
        });

    if (!item) {
        return;
    }

    const purchasePriceInput =
        prompt(
            "Purchase price:",
            item.purchasePrice
        );

    if (purchasePriceInput === null) {
        return;
    }

    const quantityInput =
        prompt(
            "Quantity:",
            item.quantity
        );

    if (quantityInput === null) {
        return;
    }

    const unitInput =
        prompt(
            "Unit (kg, g, liter, ml, piece, etc.):",
            item.unit
        );

    if (unitInput === null) {
        return;
    }

    const sellingPriceInput =
        prompt(
            "Selling price:",
            item.sellingPrice
        );

    if (sellingPriceInput === null) {
        return;
    }

    const purchasePrice =
        numberValue(purchasePriceInput);

    const quantity =
        numberValue(quantityInput);

    const unit =
        unitInput.trim();

    const sellingPrice =
        numberValue(sellingPriceInput);

    if (
        purchasePrice < 0 ||
        quantity <= 0 ||
        !unit ||
        sellingPrice <= 0
    ) {

        alert(
            "Please enter valid values."
        );

        return;
    }

    const unitCost =
        purchasePrice / quantity;

    const { error } =
        await supabaseClient
            .from("other_items")
            .update({
                purchase_price:
                    purchasePrice,
                quantity:
                    quantity,
                unit:
                    unit,
                unit_cost:
                    unitCost,
                selling_price:
                    sellingPrice
            })
            .eq("id", Number(id))
            .eq("user_id", currentUserId);

    if (error) {

        console.error(
            "Supabase other item edit error:",
            error
        );

        showMessage(
            "otherItemMessage",
            "Unable to update other item.",
            "error"
        );

        return;
    }

    await renderOtherItemList();

    showMessage(
        "otherItemMessage",
        "Other item updated successfully.",
        "success"
    );
}


async function deleteOtherItem(id) {

    if (!confirm("Delete this other item?")) {
        return;
    }

    const { error } =
        await supabaseClient
            .from("other_items")
            .delete()
            .eq("id", Number(id))
            .eq("user_id", currentUserId);

    if (error) {

        console.error(
            "Supabase other item delete error:",
            error
        );

        showMessage(
            "otherItemMessage",
            "Unable to delete other item.",
            "error"
        );

        return;
    }

    otherItems =
        otherItems.filter(function(item) {
            return String(item.id) !== String(id);
        });

    await renderOtherItemList();

    showMessage(
        "otherItemMessage",
        "Other item deleted successfully.",
        "success"
    );
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

        '<input ' +
        'type="text" ' +
        'class="recipe-ingredient-search" ' +
        'placeholder="Search ingredient..." ' +
        'autocomplete="off" ' +
        'oninput="searchRecipeIngredients(this)" ' +
        'onclick="showRecipeIngredientSearch(this)" ' +
        '>' +

        '<input ' +
        'type="hidden" ' +
        'class="recipe-ingredient-select" ' +
        'value="" ' +
        '>' +

        '<div ' +
        'class="recipe-ingredient-results" ' +
        'style="display:none;"' +
        '></div>' +

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

    refreshRecipeIngredientSearchResults();
}

    populateRecipeIngredientSelect(row);
}

/* =========================================================
   RECIPE INGREDIENT SMART SEARCH
========================================================= */

function getRecipeSelectedIngredientIds(excludeRow) {

    const selectedIds = [];

    document
        .querySelectorAll(".recipe-ingredient-row")
        .forEach(function(row) {

            if (excludeRow && row === excludeRow) {
                return;
            }

            const select =
                row.querySelector(
                    ".recipe-ingredient-select"
                );

            if (
                select &&
                select.value
            ) {
                selectedIds.push(
                    String(select.value)
                );
            }
        });

    return selectedIds;
}


function getRecipeIngredientSearchValue(input) {

    if (!input) {
        return "";
    }

    return String(input.value || "")
        .trim()
        .toLowerCase();
}


function renderRecipeIngredientSearchResults(row) {

    if (!row) {
        return;
    }

    const input =
        row.querySelector(
            ".recipe-ingredient-search"
        );

    const results =
        row.querySelector(
            ".recipe-ingredient-results"
        );

    if (!input || !results) {
        return;
    }

    const searchText =
        getRecipeIngredientSearchValue(input);

    const selectedIds =
        getRecipeSelectedIngredientIds(row);

    const currentSelect =
        row.querySelector(
            ".recipe-ingredient-select"
        );

    const currentId =
        currentSelect
            ? String(currentSelect.value || "")
            : "";

    results.innerHTML = "";

    let matches =
        ingredientPrices.filter(
            function(item) {

                const itemId =
                    String(item.id);

                if (
                    selectedIds.includes(itemId) &&
                    itemId !== currentId
                ) {
                    return false;
                }

                if (!searchText) {
                    return true;
                }

                return String(item.name || "")
                    .toLowerCase()
                    .includes(searchText);
            }
        );

    if (matches.length === 0) {

        results.innerHTML =
            '<div style="padding:10px;color:#777;font-size:12px;">' +
            'No ingredients found' +
            '</div>';

        results.style.display = "block";

        return;
    }

    matches.forEach(
        function(item) {

            const result =
                document.createElement("div");

            result.className =
                "recipe-ingredient-search-result";

            result.textContent =
                item.name;

            result.style.padding = "10px";
            result.style.cursor = "pointer";
            result.style.background = "#ffffff";
            result.style.borderBottom =
                "1px solid #eeeeee";
            result.style.fontSize = "13px";

            result.onclick =
                function(event) {

                    event.preventDefault();
                    event.stopPropagation();

                    selectRecipeIngredient(
                        row,
                        item.id
                    );
                };

            results.appendChild(result);
        }
    );

    results.style.display = "block";
}


function searchRecipeIngredients(input) {

    const row =
        input.closest(
            ".recipe-ingredient-row"
        );

    if (!row) {
        return;
    }

    renderRecipeIngredientSearchResults(row);
}


function showRecipeIngredientSearch(input) {

    const row =
        input.closest(
            ".recipe-ingredient-row"
        );

    if (!row) {
        return;
    }

    renderRecipeIngredientSearchResults(row);
}


function selectRecipeIngredient(row, ingredientId) {

    if (!row) {
        return;
    }

    const select =
        row.querySelector(
            ".recipe-ingredient-select"
        );

    const input =
        row.querySelector(
            ".recipe-ingredient-search"
        );

    const results =
        row.querySelector(
            ".recipe-ingredient-results"
        );

    const ingredient =
        ingredientPrices.find(
            function(item) {
                return String(item.id) ===
                    String(ingredientId);
            }
        );

    if (!select || !ingredient) {
        return;
    }

    select.value =
        String(ingredient.id);

    if (input) {
        input.value =
            ingredient.name;
    }

    if (results) {
        results.innerHTML = "";
        results.style.display = "none";
    }

    calculateRecipeTotal();

    refreshRecipeIngredientSearchResults();
}


function refreshRecipeIngredientSearchResults() {

    document
        .querySelectorAll(
            ".recipe-ingredient-row"
        )
        .forEach(
            function(row) {

                const input =
                    row.querySelector(
                        ".recipe-ingredient-search"
                    );

                const results =
                    row.querySelector(
                        ".recipe-ingredient-results"
                    );

                if (!input || !results) {
                    return;
                }

                if (
                    document.activeElement === input &&
                    results.style.display === "block"
                ) {
                    renderRecipeIngredientSearchResults(
                        row
                    );
                }
            }
        );
}

function refreshRecipeIngredientDropdowns() {

    document
        .querySelectorAll(
            ".recipe-ingredient-row"
        )
        .forEach(
            function(row) {

                populateRecipeIngredientSelect(
                    row
                );
            }
        );

    refreshRecipeIngredientSearchResults();
}


function refreshRecipeIngredientDropdowns() {

    document
        .querySelectorAll(".recipe-ingredient-row")
        .forEach(function(row) {
            populateRecipeIngredientSelect(row);
        });
}
function removeRecipeIngredient(button) {

    const row =
        button.closest(
            ".recipe-ingredient-row"
        );

    if (row) {
        row.remove();
    }

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

function ensureDailySalesRowIds(record) {

    if (!record) {
        return;
    }

    if (
        !Array.isArray(record.foodItems)
    ) {
        record.foodItems = [];
    }

    if (
        !Array.isArray(record.otherItems)
    ) {
        record.otherItems = [];
    }

    record.foodItems.forEach(
        function(item) {

            if (
                !item.rowId
            ) {
                item.rowId =
                    createSalesRowId();
            }
        }
    );

    record.otherItems.forEach(
        function(item) {

            if (
                !item.rowId
            ) {
                item.rowId =
                    createSalesRowId();
            }
        }
    );
}


/* ---------------------------------------------------------
   LOAD DAILY SALES SCREEN
--------------------------------------------------------- */

function loadDailySalesScreen() {

    const dateInput =
        document.getElementById(
            "dailySalesDate"
        );

    if (!dateInput.value) {
        dateInput.value =
            todayString();
    }

    currentSalesSoldOutFoodIds = [];

    renderDailySales(
        dateInput.value
    );
}
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

    const alreadyExists =
        record.foodItems.some(
            function(item) {

                return getCookedFoodKey(item) === id;
            }
        );

    if (alreadyExists) {

        showMessage(
            "salesMessage",
            menuItem.recipeName + " is already added.",
            "error"
        );

        renderSalesFoodDropdown(date);

        return;
    }

    const foodItem = {

        id: createSalesRowId(),

        menuItemId:
            String(menuItem.recipeId),

        recipeId:
            String(menuItem.recipeId),

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
                numberValue(menuItem.servings),
                1
            ),

        sales: 0,

        cost: 0,

        profit: 0,

        soldOut: false
    };

    record.foodItems.push(foodItem);

    saveAllData();

    renderSalesFoodDropdown(date);
    renderSalesFoodItems(record);
    calculateSalesTotals();

    select.value = "";
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

    const date =
        document.getElementById(
            "salesDate"
        ).value;

    const otherItem =
        otherItems.find(
            function(item) {

                return String(item.id) === id;
            }
        );

    if (!otherItem) {
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
            soldOutFoodIds: []
        };

        dailySalesRecords.push(record);
    }

    if (!Array.isArray(record.otherItems)) {
        record.otherItems = [];
    }

    const alreadyExists =
        record.otherItems.some(
            function(item) {

                return String(
                    item.otherItemId
                ) === id;
            }
        );

    if (alreadyExists) {

        showMessage(
            "salesMessage",
            otherItem.name + " is already added.",
            "error"
        );

        return;
    }

    const item = {

        id: createSalesRowId(),

        otherItemId: id,

        itemId: id,

        itemName:
            otherItem.name,

        quantitySold: 0,

        sellingPrice:
            numberValue(
                otherItem.sellingPrice
            ),

        costPerItem:
            numberValue(
                otherItem.unitCost
            ),

        sales: 0,

        cost: 0,

        profit: 0
    };

    record.otherItems.push(item);

    saveAllData();

    renderSalesOtherDropdown(date);
    renderSalesOtherItems(record);
    calculateSalesTotals();

    select.value = "";
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

    const date =
        document.getElementById(
            "salesDate"
        ).value;

    let record =
        getSavedDailySales(date);

    if (!record) {
        return;
    }

    if (!Array.isArray(record.soldOutFoodIds)) {
        record.soldOutFoodIds = [];
    }

    id = String(id);

    if (
        record.soldOutFoodIds
            .map(function(x) {
                return String(x);
            })
            .indexOf(id) === -1
    ) {

        record.soldOutFoodIds.push(id);
    }

    currentSalesSoldOutFoodIds =
        record.soldOutFoodIds.map(
            function(x) {
                return String(x);
            }
        );

    saveAllData();

    loadDailySales();

    showMessage(
        "salesMessage",
        "Cooked food marked as Sold Out.",
        "success"
    );
}


/* ---------------------------------------------------------
   DELETE COOKED FOOD
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

    if (!confirm("Delete this cooked food from Daily Sales?")) {
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

            const quantity =
                numberValue(
                    item.quantitySold
                );

            const sellingPrice =
                numberValue(
                    item.sellingPrice
                );

            const unitCost =
                numberValue(
                    item.unitCost
                );

            const sales =
                quantity *
                sellingPrice;

            const cost =
                quantity *
                unitCost;

            const profit =
                sales - cost;

            const div =
                document.createElement("div");

            div.className =
                "sales-row";

            div.dataset.rowId =
                item.id;

            div.innerHTML =

                '<div class="sales-row-top">' +

                '<div class="sales-row-name">' +
                escapeHtml(
                    item.name
                ) +
                "</div>" +

                '<div class="button-row">' +

                '<button type="button" class="btn btn-danger btn-small" onclick="deleteSalesOtherItem(\'' +
                item.id +
                '\')">Delete</button>' +

                "</div>" +

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
                money(sellingPrice) +
                "</strong>" +
                "</div>" +

                '<div class="sales-box">' +
                '<label>Cost / Item</label>' +
                '<strong>' +
                money(unitCost) +
                "</strong>" +
                "</div>" +

                '<div class="sales-box">' +
                '<label>Sales</label>' +
                '<strong class="row-sales">' +
                money(sales) +
                "</strong>" +
                "</div>" +

                '<div class="sales-box">' +
                '<label>Item Cost</label>' +
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
   DELETE OTHER ITEM FROM DAILY SALES
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

    const dateInput =
        document.getElementById(
            "salesDate"
        );

    if (!dateInput) {
        return;
    }

    const date =
        dateInput.value;

    const record =
        getSavedDailySales(date);

    let foodSales = 0;
    let otherSales = 0;

    let foodCost = 0;
    let otherCost = 0;

    if (
        record &&
        Array.isArray(record.foodItems)
    ) {

        record.foodItems.forEach(
            function(item) {

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

                foodSales += sales;
                foodCost += cost;
            }
        );
    }

    if (
        record &&
        Array.isArray(record.otherItems)
    ) {

        record.otherItems.forEach(
            function(item) {

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

                otherSales += sales;
                otherCost += cost;
            }
        );
    }

    const totalSales =
        foodSales +
        otherSales;

    const totalCost =
        foodCost +
        otherCost;

    const grossProfit =
        totalSales -
        totalCost;

    const foodSalesElement =
        document.getElementById(
            "foodSalesTotal"
        );

    const otherSalesElement =
        document.getElementById(
            "otherSalesTotal"
        );

    const totalSalesElement =
        document.getElementById(
            "totalSales"
        );

    const foodCostElement =
        document.getElementById(
            "foodCostTotal"
        );

    const otherCostElement =
        document.getElementById(
            "otherCostTotal"
        );

    const totalCostElement =
        document.getElementById(
            "totalCost"
        );

    const grossProfitElement =
        document.getElementById(
            "grossProfit"
        );

    if (foodSalesElement) {
        foodSalesElement.textContent =
            money(foodSales);
    }

    if (otherSalesElement) {
        otherSalesElement.textContent =
            money(otherSales);
    }

    if (totalSalesElement) {
        totalSalesElement.textContent =
            money(totalSales);
    }

    if (foodCostElement) {
        foodCostElement.textContent =
            money(foodCost);
    }

    if (otherCostElement) {
        otherCostElement.textContent =
            money(otherCost);
    }

    if (totalCostElement) {
        totalCostElement.textContent =
            money(totalCost);
    }

    if (grossProfitElement) {
        grossProfitElement.textContent =
            money(grossProfit);
    }

    return {
        foodSales: foodSales,
        otherSales: otherSales,
        totalSales: totalSales,
        foodCost: foodCost,
        otherCost: otherCost,
        totalCost: totalCost,
        grossProfit: grossProfit
    };
}
/* ---------------------------------------------------------
   SAVE DAILY SALES
--------------------------------------------------------- */

function saveDailySales() {

    const dateInput =
        document.getElementById(
            "salesDate"
        );

    if (!dateInput ||
        !dateInput.value) {

        showMessage(
            "salesMessage",
            "Please select a date.",
            "error"
        );

        return;
    }

    const date =
        dateInput.value;

    let record =
        getSavedDailySales(date);

    if (!record) {

        record = {

            id: createSalesRowId(),

            date: date,

            foodItems: [],

            otherItems: [],

            soldOutFoodIds: [],

            foodSales: 0,

            otherSales: 0,

            totalSales: 0,

            foodCost: 0,

            otherCost: 0,

            totalCost: 0,

            grossProfit: 0,

            expenses: 0,

            profit: 0
        };

        dailySalesRecords.push(record);
    }

    ensureDailySalesRowIds(record);

    const totals =
        calculateSalesTotals();

    record.foodSales =
        totals.foodSales;

    record.otherSales =
        totals.otherSales;

    record.totalSales =
        totals.totalSales;

    record.foodCost =
        totals.foodCost;

    record.otherCost =
        totals.otherCost;

    record.totalCost =
        totals.totalCost;

    record.grossProfit =
        totals.grossProfit;

    record.soldOutFoodIds =
        currentSalesSoldOutFoodIds.map(
            function(id) {
                return String(id);
            }
        );

    saveAllData();

    showMessage(
        "salesMessage",
        "Daily Sales saved successfully.",
        "success"
    );

    loadDailySalesRecords();
}


/* ---------------------------------------------------------
   DAILY SALES RECORDS
--------------------------------------------------------- */

function loadDailySalesRecords() {

    const dateInput =
        document.getElementById(
            "salesRecordDate"
        );

    if (!dateInput) {
        return;
    }

    if (!dateInput.value) {
        dateInput.value =
            todayString();
    }

    renderDailySalesRecords(
        dateInput.value
    );
}


function renderDailySalesRecords(date) {

    const container =
        document.getElementById(
            "dailySalesRecords"
        );

    if (!container) {
        return;
    }

    const records =
        dailySalesRecords.filter(
            function(record) {
                return record.date === date;
            }
        );

    if (records.length === 0) {

        container.innerHTML =
            '<div class="empty">No Daily Sales records found.</div>';

        return;
    }

    container.innerHTML = "";

    records.forEach(
        function(record) {

            const div =
                document.createElement("div");

            div.className =
                "record-card";

            div.innerHTML =

                '<div class="record-title">' +
                "Daily Sales Monitoring" +
                "</div>" +

                '<div class="record-date">' +
                escapeHtml(record.date) +
                "</div>" +

                '<div class="record-grid">' +

                '<div>' +
                '<span>Food Sales</span>' +
                "<strong>" +
                money(record.foodSales) +
                "</strong>" +
                "</div>" +

                '<div>' +
                '<span>Other Sales</span>' +
                "<strong>" +
                money(record.otherSales) +
                "</strong>" +
                "</div>" +

                '<div>' +
                '<span>Total Sales</span>' +
                "<strong>" +
                money(record.totalSales) +
                "</strong>" +
                "</div>" +

                '<div>' +
                '<span>Gross Profit</span>' +
                "<strong>" +
                money(record.grossProfit) +
                "</strong>" +
                "</div>" +

                "</div>" +

                '<div style="margin-top:8px;">' +

                '<button type="button" class="btn btn-danger btn-small" onclick="deleteDailySalesRecord(\'' +
                record.id +
                '\')">' +
                "Delete" +
                "</button>" +

                "</div>";

            container.appendChild(div);
        }
    );
}


/* ---------------------------------------------------------
   DELETE DAILY SALES RECORD
--------------------------------------------------------- */

function deleteDailySalesRecord(id) {

    if (!confirm("Delete this Daily Sales record?")) {
        return;
    }

    dailySalesRecords =
        dailySalesRecords.filter(
            function(record) {
                return String(record.id) !==
                    String(id);
            }
        );

    saveAllData();

    loadDailySalesRecords();

    const dateInput =
        document.getElementById(
            "salesDate"
        );

    if (dateInput) {
        loadDailySales();
    }
}


/* =========================================================
   PROFIT CALCULATOR
========================================================= */

function loadProfitCalculator() {

    const dateInput =
        document.getElementById(
            "profitDate"
        );

    if (!dateInput) {
        return;
    }

    if (!dateInput.value) {
        dateInput.value =
            todayString();
    }

    calculateProfit();
}


/* ---------------------------------------------------------
   GET SALES DATA FOR PROFIT CALCULATOR
--------------------------------------------------------- */

function getSalesForProfitDate(date) {

    const record =
        getSavedDailySales(date);

    if (!record) {

        return {
            foodSales: 0,
            otherSales: 0,
            totalSales: 0,
            foodCost: 0,
            otherCost: 0,
            totalCost: 0,
            grossProfit: 0
        };
    }

    return {
        foodSales:
            numberValue(record.foodSales),

        otherSales:
            numberValue(record.otherSales),

        totalSales:
            numberValue(record.totalSales),

        foodCost:
            numberValue(record.foodCost),

        otherCost:
            numberValue(record.otherCost),

        totalCost:
            numberValue(record.totalCost),

        grossProfit:
            numberValue(record.grossProfit)
    };
}


/* ---------------------------------------------------------
   CALCULATE PROFIT
--------------------------------------------------------- */

function calculateProfit() {

    const dateInput =
        document.getElementById(
            "profitDate"
        );

    if (!dateInput) {
        return;
    }

    const date =
        dateInput.value;

    const sales =
        getSalesForProfitDate(date);

    const rent =
        numberValue(
            document.getElementById(
                "expenseRent"
            )?.value
        );

    const gas =
        numberValue(
            document.getElementById(
                "expenseGas"
            )?.value
        );

    const electricity =
        numberValue(
            document.getElementById(
                "expenseElectricity"
            )?.value
        );

    const water =
        numberValue(
            document.getElementById(
                "expenseWater"
            )?.value
        );

    const wifi =
        numberValue(
            document.getElementById(
                "expenseWifi"
            )?.value
        );

    const labor =
        numberValue(
            document.getElementById(
                "expenseLabor"
            )?.value
        );

    const otherExpenses =
        numberValue(
            document.getElementById(
                "expenseOther"
            )?.value
        );

    const totalExpenses =
        rent +
        gas +
        electricity +
        water +
        wifi +
        labor +
        otherExpenses;

    const netProfit =
        sales.grossProfit -
        totalExpenses;

    const elements = {

        foodSales:
            document.getElementById(
                "profitFoodSales"
            ),

        otherSales:
            document.getElementById(
                "profitOtherSales"
            ),

        totalSales:
            document.getElementById(
                "profitTotalSales"
            ),

        foodCost:
            document.getElementById(
                "profitFoodCost"
            ),

        otherCost:
            document.getElementById(
                "profitOtherCost"
            ),

        totalCost:
            document.getElementById(
                "profitTotalCost"
            ),

        grossProfit:
            document.getElementById(
                "profitGrossProfit"
            ),

        totalExpenses:
            document.getElementById(
                "profitTotalExpenses"
            ),

        netProfit:
            document.getElementById(
                "profitNetProfit"
            )
    };

    if (elements.foodSales) {
        elements.foodSales.textContent =
            money(sales.foodSales);
    }

    if (elements.otherSales) {
        elements.otherSales.textContent =
            money(sales.otherSales);
    }

    if (elements.totalSales) {
        elements.totalSales.textContent =
            money(sales.totalSales);
    }

    if (elements.foodCost) {
        elements.foodCost.textContent =
            money(sales.foodCost);
    }

    if (elements.otherCost) {
        elements.otherCost.textContent =
            money(sales.otherCost);
    }

    if (elements.totalCost) {
        elements.totalCost.textContent =
            money(sales.totalCost);
    }

    if (elements.grossProfit) {
        elements.grossProfit.textContent =
            money(sales.grossProfit);
    }

    if (elements.totalExpenses) {
        elements.totalExpenses.textContent =
            money(totalExpenses);
    }

    if (elements.netProfit) {
        elements.netProfit.textContent =
            money(netProfit);
    }

    return {
        date: date,
        foodSales: sales.foodSales,
        otherSales: sales.otherSales,
        totalSales: sales.totalSales,
        foodCost: sales.foodCost,
        otherCost: sales.otherCost,
        totalCost: sales.totalCost,
        grossProfit: sales.grossProfit,
        rent: rent,
        gas: gas,
        electricity: electricity,
        water: water,
        wifi: wifi,
        labor: labor,
        otherExpenses: otherExpenses,
        totalExpenses: totalExpenses,
        netProfit: netProfit
    };
}


/* ---------------------------------------------------------
   SAVE PROFIT RECORD
--------------------------------------------------------- */

function saveProfitRecord() {

    const result =
        calculateProfit();

    if (!result) {
        return;
    }

    if (!result.date) {

        showMessage(
            "profitMessage",
            "Please select a date.",
            "error"
        );

        return;
    }

    const existing =
        profitRecords.find(
            function(record) {
                return record.date ===
                    result.date;
            }
        );

    if (existing) {

        existing.foodSales =
            result.foodSales;

        existing.otherSales =
            result.otherSales;

        existing.totalSales =
            result.totalSales;

        existing.foodCost =
            result.foodCost;

        existing.otherCost =
            result.otherCost;

        existing.totalCost =
            result.totalCost;

        existing.grossProfit =
            result.grossProfit;

        existing.rent =
            result.rent;

        existing.gas =
            result.gas;

        existing.electricity =
            result.electricity;

        existing.water =
            result.water;

        existing.wifi =
            result.wifi;

        existing.labor =
            result.labor;

        existing.otherExpenses =
            result.otherExpenses;

        existing.totalExpenses =
            result.totalExpenses;

        existing.netProfit =
            result.netProfit;

    } else {

        profitRecords.push({

            id: createSalesRowId(),

            date: result.date,

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

            rent:
                result.rent,

            gas:
                result.gas,

            electricity:
                result.electricity,

            water:
                result.water,

            wifi:
                result.wifi,

            labor:
                result.labor,

            otherExpenses:
                result.otherExpenses,

            totalExpenses:
                result.totalExpenses,

            netProfit:
                result.netProfit
        });
    }

    saveAllData();

    showMessage(
        "profitMessage",
        "Profit record saved successfully.",
        "success"
    );

    loadProfitRecords();
}
/* =========================================================
   PROFIT RECORDS
========================================================= */

function loadProfitRecords() {

    const dateInput =
        document.getElementById(
            "profitRecordDate"
        );

    if (!dateInput) {
        return;
    }

    if (!dateInput.value) {
        dateInput.value =
            todayString();
    }

    renderProfitRecords(
        dateInput.value
    );
}


function renderProfitRecords(date) {

    const container =
        document.getElementById(
            "profitRecords"
        );

    if (!container) {
        return;
    }

    const records =
        profitRecords.filter(
            function(record) {
                return record.date === date;
            }
        );

    if (records.length === 0) {

        container.innerHTML =
            '<div class="empty">No Profit Calculator records found.</div>';

        return;
    }

    container.innerHTML = "";

    records.forEach(
        function(record) {

            const div =
                document.createElement("div");

            div.className =
                "record-card";

            div.innerHTML =

                '<div class="record-title">' +
                "Profit Calculator" +
                "</div>" +

                '<div class="record-date">' +
                escapeHtml(record.date) +
                "</div>" +

                '<div class="record-grid">' +

                '<div>' +
                '<span>Total Sales</span>' +
                "<strong>" +
                money(record.totalSales) +
                "</strong>" +
                "</div>" +

                '<div>' +
                '<span>Gross Profit</span>' +
                "<strong>" +
                money(record.grossProfit) +
                "</strong>" +
                "</div>" +

                '<div>' +
                '<span>Total Expenses</span>' +
                "<strong>" +
                money(record.totalExpenses) +
                "</strong>" +
                "</div>" +

                '<div>' +
                '<span>Net Profit</span>' +
                "<strong>" +
                money(record.netProfit) +
                "</strong>" +
                "</div>" +

                "</div>" +

                '<div style="margin-top:8px;">' +

                '<button type="button" class="btn btn-danger btn-small" onclick="deleteProfitRecord(\'' +
                record.id +
                '\')">' +
                "Delete" +
                "</button>" +

                "</div>";

            container.appendChild(div);
        }
    );
}


function deleteProfitRecord(id) {

    if (!confirm("Delete this Profit Calculator record?")) {
        return;
    }

    profitRecords =
        profitRecords.filter(
            function(record) {
                return String(record.id) !==
                    String(id);
            }
        );

    saveAllData();

    loadProfitRecords();
}


/* =========================================================
   DASHBOARD
========================================================= */

function loadDashboard() {

    renderDashboard();
}


function renderDashboard() {

    let totalSales = 0;
    let totalGrossProfit = 0;
    let totalExpenses = 0;
    let totalNetProfit = 0;

    dailySalesRecords.forEach(
        function(record) {

            totalSales +=
                numberValue(
                    record.totalSales
                );

            totalGrossProfit +=
                numberValue(
                    record.grossProfit
                );
        }
    );

    profitRecords.forEach(
        function(record) {

            totalExpenses +=
                numberValue(
                    record.totalExpenses
                );

            totalNetProfit +=
                numberValue(
                    record.netProfit
                );
        }
    );

    const totalSalesElement =
        document.getElementById(
            "dashboardTotalSales"
        );

    const totalGrossProfitElement =
        document.getElementById(
            "dashboardGrossProfit"
        );

    const totalExpensesElement =
        document.getElementById(
            "dashboardExpenses"
        );

    const totalNetProfitElement =
        document.getElementById(
            "dashboardNetProfit"
        );

    if (totalSalesElement) {

        totalSalesElement.textContent =
            money(totalSales);
    }

    if (totalGrossProfitElement) {

        totalGrossProfitElement.textContent =
            money(totalGrossProfit);
    }

    if (totalExpensesElement) {

        totalExpensesElement.textContent =
            money(totalExpenses);
    }

    if (totalNetProfitElement) {

        totalNetProfitElement.textContent =
            money(totalNetProfit);
    }

    const recipeCountElement =
        document.getElementById(
            "dashboardRecipeCount"
        );

    const ingredientCountElement =
        document.getElementById(
            "dashboardIngredientCount"
        );

    const otherItemCountElement =
        document.getElementById(
            "dashboardOtherItemCount"
        );

    if (recipeCountElement) {

        recipeCountElement.textContent =
            savedRecipes.length;
    }

    if (ingredientCountElement) {

        ingredientCountElement.textContent =
            ingredientPrices.length;
    }

    if (otherItemCountElement) {

        otherItemCountElement.textContent =
            otherItems.length;
    }
}


/* =========================================================
   RECORDS SCREEN
========================================================= */

function loadRecordsScreen() {

    const dateInput =
        document.getElementById(
            "recordsDate"
        );

    if (!dateInput) {
        return;
    }

    if (!dateInput.value) {
        dateInput.value =
            todayString();
    }

    renderAllRecords(
        dateInput.value
    );
}


function renderAllRecords(date) {

    const container =
        document.getElementById(
            "allRecordsList"
        );

    if (!container) {
        return;
    }

    container.innerHTML = "";

    const salesRecords =
        dailySalesRecords.filter(
            function(record) {
                return record.date === date;
            }
        );

    const profitRecordList =
        profitRecords.filter(
            function(record) {
                return record.date === date;
            }
        );

    if (
        salesRecords.length === 0 &&
        profitRecordList.length === 0
    ) {

        container.innerHTML =
            '<div class="empty">No records found for this date.</div>';

        return;
    }

    salesRecords.forEach(
        function(record) {

            const div =
                document.createElement("div");

            div.className =
                "record-card";

            div.innerHTML =

                '<div class="record-title">' +
                "Daily Sales Monitoring" +
                "</div>" +

                '<div class="record-date">' +
                escapeHtml(record.date) +
                "</div>" +

                '<div class="record-grid">' +

                '<div>' +
                '<span>Sales</span>' +
                "<strong>" +
                money(record.totalSales) +
                "</strong>" +
                "</div>" +

                '<div>' +
                '<span>Food Cost</span>' +
                "<strong>" +
                money(record.foodCost) +
                "</strong>" +
                "</div>" +

                '<div>' +
                '<span>Total Cost</span>' +
                "<strong>" +
                money(record.totalCost) +
                "</strong>" +
                "</div>" +

                '<div>' +
                '<span>Gross Profit</span>' +
                "<strong>" +
                money(record.grossProfit) +
                "</strong>" +
                "</div>" +

                "</div>";

            container.appendChild(div);
        }
    );

    profitRecordList.forEach(
        function(record) {

            const div =
                document.createElement("div");

            div.className =
                "record-card";

            div.innerHTML =

                '<div class="record-title">' +
                "Profit Calculator" +
                "</div>" +

                '<div class="record-date">' +
                escapeHtml(record.date) +
                "</div>" +

                '<div class="record-grid">' +

                '<div>' +
                '<span>Sales</span>' +
                "<strong>" +
                money(record.totalSales) +
                "</strong>" +
                "</div>" +

                '<div>' +
                '<span>Expenses</span>' +
                "<strong>" +
                money(record.totalExpenses) +
                "</strong>" +
                "</div>" +

                '<div>' +
                '<span>Gross Profit</span>' +
                "<strong>" +
                money(record.grossProfit) +
                "</strong>" +
                "</div>" +

                '<div>' +
                '<span>Net Profit</span>' +
                "<strong>" +
                money(record.netProfit) +
                "</strong>" +
                "</div>" +

                "</div>";

            container.appendChild(div);
        }
    );
}


/* =========================================================
   INITIAL SCREEN DATA
========================================================= */

function refreshAllScreens() {

    renderIngredientList();

    renderOtherItemList();

    loadSavedRecipes();

    loadMenuOfDay();

    loadDailySales();

    loadDailySalesRecords();

    calculateProfit();

    loadProfitRecords();

    loadRecordsScreen();

    renderDashboard();
}
/* =========================================================
   GENERAL FORM HELPERS
========================================================= */

function clearInput(id) {

    const element =
        document.getElementById(id);

    if (element) {
        element.value = "";
    }
}


function setInputValue(id, value) {

    const element =
        document.getElementById(id);

    if (element) {
        element.value = value;
    }
}


/* =========================================================
   DATE CHANGE HANDLERS
========================================================= */

function changeRecipeDate() {

    const date =
        document.getElementById(
            "recipeDate"
        ).value;

    if (!date) {
        return;
    }

    const savedDate =
        document.getElementById(
            "savedRecipeDate"
        );

    if (savedDate) {
        savedDate.value = date;
    }

    loadSavedRecipes();
}


function changeSavedRecipeDate() {

    const date =
        document.getElementById(
            "savedRecipeDate"
        ).value;

    if (!date) {
        return;
    }

    const recipeDate =
        document.getElementById(
            "recipeDate"
        );

    if (recipeDate) {
        recipeDate.value = date;
    }

    loadSavedRecipes();
}


function changeMenuDate() {

    const date =
        document.getElementById(
            "menuDate"
        ).value;

    if (!date) {
        return;
    }

    renderMenuItems(date);
}


function changeSalesDate() {

    const date =
        document.getElementById(
            "salesDate"
        ).value;

    if (!date) {
        return;
    }

    currentSalesSoldOutFoodIds = [];

    loadDailySales();
}


function changeSalesRecordDate() {

    const date =
        document.getElementById(
            "salesRecordDate"
        ).value;

    if (!date) {
        return;
    }

    renderDailySalesRecords(date);
}


function changeProfitDate() {

    calculateProfit();
}


function changeProfitRecordDate() {

    const date =
        document.getElementById(
            "profitRecordDate"
        ).value;

    if (!date) {
        return;
    }

    renderProfitRecords(date);
}


function changeRecordsDate() {

    const date =
        document.getElementById(
            "recordsDate"
        ).value;

    if (!date) {
        return;
    }

    renderAllRecords(date);
}


/* =========================================================
   EXPENSE INPUT EVENTS
========================================================= */

function attachProfitExpenseListeners() {

    const ids = [

        "expenseRent",

        "expenseGas",

        "expenseElectricity",

        "expenseWater",

        "expenseWifi",

        "expenseLabor",

        "expenseOther"
    ];

    ids.forEach(
        function(id) {

            const element =
                document.getElementById(id);

            if (!element) {
                return;
            }

            element.addEventListener(
                "input",
                function() {
                    calculateProfit();
                }
            );
        }
    );
}


/* =========================================================
   NAVIGATION
========================================================= */

function initializeNavigation() {

    const buttons =
        document.querySelectorAll(
            "[data-screen]"
        );

    buttons.forEach(
        function(button) {

            button.addEventListener(
                "click",
                function() {

                    const screen =
                        button.dataset.screen;

                    if (!screen) {
                        return;
                    }

                    showScreen(screen);
                }
            );
        }
    );
}


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        initializeNavigation();

        attachProfitExpenseListeners();

        const today =
            todayString();

        const dateIds = [

            "recipeDate",

            "savedRecipeDate",

            "menuDate",

            "salesDate",

            "salesRecordDate",

            "profitDate",

            "profitRecordDate",

            "recordsDate"
        ];

        dateIds.forEach(
            function(id) {

                const element =
                    document.getElementById(id);

                if (
                    element &&
                    !element.value
                ) {

                    element.value =
                        today;
                }
            }
        );

        /*
           Initial local rendering.
           Cloud data will be loaded again
           after authentication.
        */

        normalizeDailySalesRecords();

        refreshAllScreens();
    }
);


/* =========================================================
   SUPABASE AUTHENTICATION
========================================================= */

async function handleLogin() {

    const email =
        document.getElementById(
            "loginEmail"
        ).value.trim();

    const password =
        document.getElementById(
            "loginPassword"
        ).value;

    if (!email || !password) {

        showMessage(
            "authMessage",
            "Please enter your email and password.",
            "error"
        );

        return;
    }

    const button =
        document.getElementById(
            "loginBtn"
        );

    if (button) {
        button.disabled = true;
    }

    const {
        data,
        error
    } =
        await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

    if (button) {
        button.disabled = false;
    }

    if (error) {

        showMessage(
            "authMessage",
            error.message,
            "error"
        );

        return;
    }

    if (data && data.user) {

        currentUserId =
            data.user.id;

        loadUserScopedData(
            currentUserId
        );

        await loadCloudIngredients();

        await loadCloudOtherItems();

        updateAppAccess();

        refreshAllScreens();
    }
}


async function handleSignup() {

    const email =
        document.getElementById(
            "signupEmail"
        ).value.trim();

    const password =
        document.getElementById(
            "signupPassword"
        ).value;

    if (!email || !password) {

        showMessage(
            "authMessage",
            "Please enter an email and password.",
            "error"
        );

        return;
    }

    if (password.length < 6) {

        showMessage(
            "authMessage",
            "Password must be at least 6 characters.",
            "error"
        );

        return;
    }

    const button =
        document.getElementById(
            "signupBtn"
        );

    if (button) {
        button.disabled = true;
    }

    const {
        data,
        error
    } =
        await supabaseClient.auth.signUp({
            email: email,
            password: password
        });

    if (button) {
        button.disabled = false;
    }

    if (error) {

        showMessage(
            "authMessage",
            error.message,
            "error"
        );

        return;
    }

    if (data && data.user) {

        currentUserId =
            data.user.id;

        loadUserScopedData(
            currentUserId
        );

        if (data.session) {

            await loadCloudIngredients();

            await loadCloudOtherItems();

            updateAppAccess();

            refreshAllScreens();

            showMessage(
                "authMessage",
                "Account created successfully.",
                "success"
            );

        } else {

            showMessage(
                "authMessage",
                "Account created. Please check your email to confirm your account.",
                "success"
            );
        }
    }
}


/* =========================================================
   LOGOUT
========================================================= */

async function handleLogout() {

    const {
        error
    } =
        await supabaseClient.auth.signOut();

    if (error) {

        showMessage(
            "authMessage",
            error.message,
            "error"
        );

        return;
    }

    currentUserId = null;

    userDataLoaded = false;

    savedRecipes = [];

    savedMenus = [];

    dailySalesRecords = [];

    profitRecords = [];

    ingredientPrices = [];

    otherItems = [];

    currentSalesSoldOutFoodIds = [];

    updateAppAccess();
}


/* =========================================================
   AUTH BUTTON EVENTS
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        const loginBtn =
            document.getElementById(
                "loginBtn"
            );

        const signupBtn =
            document.getElementById(
                "signupBtn"
            );

        const logoutBtn =
            document.getElementById(
                "logoutBtn"
            );

        if (loginBtn) {

            loginBtn.addEventListener(
                "click",
                handleLogin
            );
        }

        if (signupBtn) {

            signupBtn.addEventListener(
                "click",
                handleSignup
            );
        }

        if (logoutBtn) {

            logoutBtn.addEventListener(
                "click",
                handleLogout
            );
        }
    }
);
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

    if (!container) {
        return;
    }

    const dates = [];

    dailySalesRecords.forEach(
        function(record) {

            if (
                record.date &&
                dates.indexOf(record.date) === -1
            ) {

                dates.push(
                    record.date
                );
            }
        }
    );

    profitRecords.forEach(
        function(record) {

            if (
                record.date &&
                dates.indexOf(record.date) === -1
            ) {

                dates.push(
                    record.date
                );
            }
        }
    );

    if (dates.length === 0) {

        container.innerHTML =
            '<div class="empty">No saved records yet.</div>';

        return;
    }

    const months = {};

    dates.forEach(
        function(date) {

            const key =
                date.substring(0, 7);

            if (!months[key]) {
                months[key] = [];
            }

            months[key].push(date);
        }
    );

    const sortedMonths =
        Object.keys(months)
            .sort()
            .reverse();

    container.innerHTML = "";

    sortedMonths.forEach(
        function(monthKey, index) {

            const datesInMonth =
                months[monthKey]
                    .sort()
                    .reverse();

            const folder =
                document.createElement("div");

            folder.className =
                "month-folder";

            const header =
                document.createElement("button");

            header.className =
                "month-header";

            header.type =
                "button";

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
                        dailySalesRecords.find(
                            function(record) {
                                return record.date === date;
                            }
                        );

                    const profitRecord =
                        profitRecords.find(
                            function(record) {
                                return record.date === date;
                            }
                        );

                    const day =
                        document.createElement("div");

                    day.className =
                        "record-card";

                    let html =
                        '<div class="record-title">' +
                        escapeHtml(date) +
                        "</div>";

                    if (salesRecord) {

                        html +=

                            '<div class="record-subtitle">' +
                            "Daily Sales Monitoring" +
                            "</div>" +

                            '<div class="record-grid">' +

                            '<div>' +
                            "<span>Sales</span>" +
                            "<strong>" +
                            money(
                                salesRecord.totalSales
                            ) +
                            "</strong>" +
                            "</div>" +

                            '<div>' +
                            "<span>Food Cost</span>" +
                            "<strong>" +
                            money(
                                salesRecord.foodCost
                            ) +
                            "</strong>" +
                            "</div>" +

                            '<div>' +
                            "<span>Total Cost</span>" +
                            "<strong>" +
                            money(
                                salesRecord.totalCost
                            ) +
                            "</strong>" +
                            "</div>" +

                            '<div>' +
                            "<span>Gross Profit</span>" +
                            "<strong>" +
                            money(
                                salesRecord.grossProfit
                            ) +
                            "</strong>" +
                            "</div>" +

                            "</div>";
                    }

                    if (profitRecord) {

                        html +=

                            '<div class="record-subtitle" style="margin-top:12px;">' +
                            "Profit Calculator" +
                            "</div>" +

                            '<div class="record-grid">' +

                            '<div>' +
                            "<span>Sales</span>" +
                            "<strong>" +
                            money(
                                profitRecord.totalSales
                            ) +
                            "</strong>" +
                            "</div>" +

                            '<div>' +
                            "<span>Expenses</span>" +
                            "<strong>" +
                            money(
                                profitRecord.totalExpenses
                            ) +
                            "</strong>" +
                            "</div>" +

                            '<div>' +
                            "<span>Gross Profit</span>" +
                            "<strong>" +
                            money(
                                profitRecord.grossProfit
                            ) +
                            "</strong>" +
                            "</div>" +

                            '<div>' +
                            "<span>Net Profit</span>" +
                            "<strong>" +
                            money(
                                profitRecord.netProfit
                            ) +
                            "</strong>" +
                            "</div>" +

                            "</div>";
                    }

                    day.innerHTML =
                        html;

                    content.appendChild(day);
                }
            );

            folder.appendChild(header);

            folder.appendChild(content);

            container.appendChild(folder);
        }
    );
}


/* =========================================================
   SCREEN REFRESH
========================================================= */

function refreshRecordsScreen() {

    renderMonthlyRecords();
}


function refreshDashboardScreen() {

    updateDashboard();
}


function refreshMenuScreen() {

    const dateInput =
        document.getElementById(
            "menuDate"
        );

    if (
        dateInput &&
        dateInput.value
    ) {

        renderMenuItems(
            dateInput.value
        );
    }
}


function refreshSalesScreen() {

    const dateInput =
        document.getElementById(
            "salesDate"
        );

    if (
        dateInput &&
        dateInput.value
    ) {

        loadDailySales();
    }
}


function refreshProfitScreen() {

    const dateInput =
        document.getElementById(
            "profitDate"
        );

    if (
        dateInput &&
        dateInput.value
    ) {

        loadProfitCalculator();
    }
}


/* =========================================================
   SCREEN OPEN EVENTS
========================================================= */

document.addEventListener(
    "click",
    function(event) {

        const button =
            event.target.closest(
                "[data-screen]"
            );

        if (!button) {
            return;
        }

        const screen =
            button.getAttribute(
                "data-screen"
            );

        if (!screen) {
            return;
        }

        setTimeout(
            function() {

                if (
                    screen ===
                    "dashboard"
                ) {

                    refreshDashboardScreen();
                }

                if (
                    screen ===
                    "menu"
                ) {

                    refreshMenuScreen();
                }

                if (
                    screen ===
                    "dailySales"
                ) {

                    refreshSalesScreen();
                }

                if (
                    screen ===
                    "profit"
                ) {

                    refreshProfitScreen();
                }

                if (
                    screen ===
                    "records"
                ) {

                    refreshRecordsScreen();
                }

            },
            0
        );
    }
);
                    if (!item.menuItemId) {

                        if (item.recipeId) {
                            item.menuItemId =
                                String(item.recipeId);

                        } else {
                            item.menuItemId =
                                String(item.id);
                        }

                        changed = true;
                    }

                    if (
                        item.soldOut === undefined
                    ) {
                        item.soldOut = false;
                        changed = true;
                    }
                }
            );

            record.otherItems.forEach(
                function(item) {

                    if (!item.id) {
                        item.id = createSalesRowId();
                        changed = true;
                    }
                }
            );
        }
    );

    if (changed) {
        saveAllData();
    }
}


/* ---------------------------------------------------------
   LOAD DAILY SALES
--------------------------------------------------------- */

function loadDailySales() {

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

    normalizeDailySalesRecords();

    const date =
        dateInput.value;

    const record =
        getSavedDailySales(date);

    currentSalesSoldOutFoodIds =
        record &&
        Array.isArray(
            record.soldOutFoodIds
        )
            ? record.soldOutFoodIds.map(
                function(id) {
                    return String(id);
                }
            )
            : [];

    renderSalesFoodItems(date);
    renderSalesOtherItems(date);
    calculateSalesTotals();
}


/* ---------------------------------------------------------
   GET MENU ITEMS FOR SALES DATE
--------------------------------------------------------- */

function getMenuItemsForSalesDate(date) {

    const menu =
        getSavedMenuForDate(date);

    if (
        !menu ||
        !Array.isArray(menu.items)
    ) {
        return [];
    }

    return menu.items;
}


/* ---------------------------------------------------------
   RENDER COOKED FOOD SALES
--------------------------------------------------------- */

function renderSalesFoodItems(date) {

    const container =
        document.getElementById(
            "salesFoodItems"
        );

    if (!container) {
        return;
    }

    const menuItems =
        getMenuItemsForSalesDate(date);

    const savedRecord =
        getSavedDailySales(date);

    const savedItems =
        savedRecord &&
        Array.isArray(
            savedRecord.foodItems
        )
            ? savedRecord.foodItems
            : [];

    container.innerHTML = "";

    if (menuItems.length === 0) {

        container.innerHTML =
            '<div class="empty">' +
            "No menu items saved for this date." +
            "</div>";

        return;
    }

    menuItems.forEach(
        function(menuItem) {

            const recipeId =
                String(
                    menuItem.recipeId
                );

            const savedItem =
                savedItems.find(
                    function(item) {

                        return String(
                            item.recipeId
                        ) === recipeId;
                    }
                );

            const row =
                document.createElement("div");

            row.className =
                "sales-food-row";

            const rowId =
                savedItem && savedItem.id
                    ? savedItem.id
                    : createSalesRowId();

            row.dataset.rowId =
                rowId;

            row.dataset.recipeId =
                recipeId;

            const quantity =
                savedItem
                    ? numberValue(
                        savedItem.quantitySold
                    )
                    : 0;

            const sellingPrice =
                numberValue(
                    menuItem.sellingPrice
                );

            const costPerServing =
                menuItem.servings > 0
                    ? numberValue(
                        menuItem.recipeCost
                    ) /
                      numberValue(
                        menuItem.servings
                    )
                    : 0;

            const soldOut =
                savedItem
                    ? savedItem.soldOut === true
                    : currentSalesSoldOutFoodIds.includes(
                        recipeId
                    );

            row.innerHTML =

                '<div class="sales-item-name">' +
                escapeHtml(
                    menuItem.recipeName
                ) +
                "</div>" +

                '<div>' +
                '<label>Qty Sold</label>' +
                '<input type="number" ' +
                'class="sales-food-quantity" ' +
                'min="0" step="1" ' +
                'value="' +
                quantity +
                '" ' +
                'oninput="updateSalesFoodQuantity(this)">' +
                "</div>" +

                '<div>' +
                '<label>Selling Price</label>' +
                '<input type="number" ' +
                'class="sales-food-price" ' +
                'min="0" step="0.01" ' +
                'value="' +
                sellingPrice +
                '" ' +
                'oninput="calculateSalesTotals()">' +
                "</div>" +

                '<div>' +
                '<label>Cost / Serving</label>' +
                '<div class="sales-value">' +
                money(
                    costPerServing
                ) +
                "</div>" +
                "</div>" +

                '<div>' +
                '<label>Sales</label>' +
                '<div class="sales-food-sales sales-value">' +
                money(
                    quantity *
                    sellingPrice
                ) +
                "</div>" +
                "</div>" +

                '<div>' +
                '<label>Profit</label>' +
                '<div class="sales-food-profit sales-value">' +
                money(
                    quantity *
                    (
                        sellingPrice -
                        costPerServing
                    )
                ) +
                "</div>" +
                "</div>" +

                '<button type="button" ' +
                'class="btn btn-small btn-danger" ' +
                'onclick="markCookedFoodSoldOut(this)">' +
                (
                    soldOut
                        ? "Unmark Sold Out"
                        : "Sold Out"
                ) +
                "</button>" +

                '<button type="button" ' +
                'class="btn btn-small btn-danger" ' +
                'onclick="deleteSalesFoodItem(this)">' +
                "Delete" +
                "</button>";

            if (soldOut) {
                row.classList.add(
                    "sold-out"
                );
            }

            container.appendChild(row);
        }
    );
}
    if (isSoldOut) {

        showMessage(
            "salesMessage",
            "This cooked food is already marked Sold Out.",
            "error"
        );

        return;
    }

    /* Do not allow duplicate cooked food rows */

    const alreadyExists =
        record.foodItems.some(
            function(item) {

                return (
                    getCookedFoodKey(item) ===
                    id
                );
            }
        );

    if (alreadyExists) {

        showMessage(
            "salesMessage",
            "This cooked food is already added.",
            "error"
        );

        return;
    }

    const servings =
        numberValue(
            menuItem.servings
        );

    const recipeCost =
        numberValue(
            menuItem.recipeCost
        );

    const costPerServing =
        servings > 0
            ? recipeCost / servings
            : 0;

    record.foodItems.push({

        id:
            createSalesRowId(),

        menuItemId:
            id,

        recipeId:
            id,

        foodName:
            menuItem.recipeName,

        quantitySold:
            0,

        sellingPrice:
            numberValue(
                menuItem.sellingPrice
            ),

        costPerServing:
            costPerServing,

        sales:
            0,

        cost:
            0,

        profit:
            0,

        soldOut:
            false
    });

    saveAllData();

    select.value = "";

    renderSalesFoodDropdown(date);

    renderSalesFoodItems(record);

    calculateSalesTotals();
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
        String(
            select.value || ""
        );

    if (!id) {
        return;
    }

    const date =
        document.getElementById(
            "salesDate"
        ).value;

    const item =
        otherItems.find(
            function(otherItem) {

                return String(
                    otherItem.id
                ) === id;
            }
        );

    if (!item) {
        return;
    }

    let record =
        getSavedDailySales(date);

    if (!record) {

        record = {

            id:
                createSalesRowId(),

            date:
                date,

            foodItems:
                [],

            otherItems:
                [],

            foodSales:
                0,

            otherSales:
                0,

            totalSales:
                0,

            foodCost:
                0,

            otherCost:
                0,

            totalCost:
                0,

            grossProfit:
                0,

            expenses:
                0,

            profit:
                0,

            soldOutFoodIds:
                []
        };

        dailySalesRecords.push(
            record
        );
    }

    if (
        !Array.isArray(
            record.otherItems
        )
    ) {
        record.otherItems = [];
    }

    const alreadyExists =
        record.otherItems.some(
            function(existingItem) {

                return String(
                    existingItem.otherItemId
                ) === id;
            }
        );

    if (alreadyExists) {

        showMessage(
            "salesMessage",
            "This other item is already added.",
            "error"
        );

        return;
    }

    record.otherItems.push({

        id:
            createSalesRowId(),

        otherItemId:
            id,

        itemId:
            id,

        itemName:
            item.name,

        quantitySold:
            0,

        sellingPrice:
            numberValue(
                item.sellingPrice
            ),

        costPerItem:
            numberValue(
                item.unitCost
            ),

        sales:
            0,

        cost:
            0,

        profit:
            0
    });

    saveAllData();

    select.value = "";

    renderSalesOtherDropdown(date);

    renderSalesOtherItems(record);

    calculateSalesTotals();
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
        !Array.isArray(
            record.foodItems
        ) ||
        record.foodItems.length === 0
    ) {

        container.innerHTML =
            '<div class="empty">' +
            "No cooked food added yet." +
            "</div>";

        return;
    }

    record.foodItems.forEach(
        function(item) {

            const row =
                document.createElement(
                    "div"
                );

            row.className =
                "sales-food-row";

            row.dataset.rowId =
                item.id;

            const quantity =
                numberValue(
                    item.quantitySold
                );

            const sellingPrice =
                numberValue(
                    item.sellingPrice
                );

            const costPerServing =
                numberValue(
                    item.costPerServing
                );

            const soldOut =
                item.soldOut === true;

            row.innerHTML =

                '<div class="sales-item-name">' +
                escapeHtml(
                    item.foodName
                ) +
                "</div>" +

                '<div>' +
                "<label>Qty Sold</label>" +
                '<input type="number" ' +
                'class="sales-food-quantity" ' +
                'min="0" step="1" ' +
                'value="' +
                quantity +
                '" ' +
                'oninput="updateSalesFoodQuantity(this)">' +
                "</div>" +

                '<div>' +
                "<label>Selling Price</label>" +
                '<input type="number" ' +
                'class="sales-food-price" ' +
                'min="0" step="0.01" ' +
                'value="' +
                sellingPrice +
                '" ' +
                'oninput="calculateSalesTotals()">' +
                "</div>" +

                '<div>' +
                "<label>Cost / Serving</label>" +
                '<div class="sales-value">' +
                money(
                    costPerServing
                ) +
                "</div>" +
                "</div>" +

                '<div>' +
                "<label>Sales</label>" +
                '<div class="sales-food-sales sales-value">' +
                money(
                    quantity *
                    sellingPrice
                ) +
                "</div>" +
                "</div>" +

                '<div>' +
                "<label>Profit</label>" +
                '<div class="sales-food-profit sales-value">' +
                money(
                    quantity *
                    (
                        sellingPrice -
                        costPerServing
                    )
                ) +
                "</div>" +
                "</div>" +

                '<button type="button" ' +
                'class="btn btn-small btn-danger" ' +
                'onclick="markCookedFoodSoldOut(this)">' +
                (
                    soldOut
                        ? "Unmark Sold Out"
                        : "Sold Out"
                ) +
                "</button>" +

                '<button type="button" ' +
                'class="btn btn-small btn-danger" ' +
                'onclick="deleteSalesFoodItem(this)">' +
                "Delete" +
                "</button>";

            if (soldOut) {

                row.classList.add(
                    "sold-out"
                );
            }

            container.appendChild(
                row
            );
        }
    );
}
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

    if (!Array.isArray(record.soldOutFoodIds)) {
        record.soldOutFoodIds = [];
    }

    if (
        record.soldOutFoodIds
            .map(function(x) {
                return String(x);
            })
            .indexOf(id) === -1
    ) {

        record.soldOutFoodIds.push(id);
    }

    record.foodItems.forEach(
        function(item) {

            if (
                getCookedFoodKey(item) === id
            ) {
                item.soldOut = true;
            }
        }
    );

    saveAllData();

    loadDailySales();
}


/* ---------------------------------------------------------
   DELETE COOKED FOOD SALES ROW
--------------------------------------------------------- */

function deleteSalesFoodItem(rowId) {

    const date =
        document.getElementById(
            "salesDate"
        ).value;

    const record =
        getSavedDailySales(date);

    if (
        !record ||
        !Array.isArray(record.foodItems)
    ) {
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
   RENDER OTHER ITEM SALES
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
            '<div class="empty">' +
            "No other items added yet." +
            "</div>";

        return;
    }

    record.otherItems.forEach(
        function(item) {

            const row =
                document.createElement(
                    "div"
                );

            row.className =
                "sales-row";

            row.dataset.rowId =
                item.id;

            const quantity =
                numberValue(
                    item.quantitySold
                );

            const sellingPrice =
                numberValue(
                    item.sellingPrice
                );

            const costPerItem =
                numberValue(
                    item.costPerItem
                );

            const sales =
                quantity *
                sellingPrice;

            const cost =
                quantity *
                costPerItem;

            const profit =
                sales - cost;

            row.innerHTML =

                '<div class="sales-row-top">' +

                '<div class="sales-row-name">' +
                escapeHtml(
                    item.itemName
                ) +
                "</div>" +

                '<div class="button-row">' +

                '<button type="button" ' +
                'class="btn btn-danger btn-small" ' +
                'onclick="deleteSalesOtherItem(\'' +
                item.id +
                '\')">' +
                "Delete" +
                "</button>" +

                "</div>" +

                "</div>" +

                '<div class="sales-grid">' +

                '<div class="sales-box">' +
                '<label>Quantity Sold</label>' +
                '<input type="number" ' +
                'class="sales-quantity" ' +
                'min="0" step="1" ' +
                'value="' +
                quantity +
                '" ' +
                'onchange="updateSalesOtherQuantity(this)">' +
                "</div>" +

                '<div class="sales-box">' +
                "<label>Selling Price</label>" +
                "<strong>" +
                money(
                    sellingPrice
                ) +
                "</strong>" +
                "</div>" +

                '<div class="sales-box">' +
                "<label>Cost / Item</label>" +
                "<strong>" +
                money(
                    costPerItem
                ) +
                "</strong>" +
                "</div>" +

                '<div class="sales-box">' +
                "<label>Sales</label>" +
                '<strong class="other-row-sales">' +
                money(
                    sales
                ) +
                "</strong>" +
                "</div>" +

                '<div class="sales-box">' +
                "<label>Cost</label>" +
                '<strong class="other-row-cost">' +
                money(
                    cost
                ) +
                "</strong>" +
                "</div>" +

                '<div class="sales-box">' +
                "<label>Profit</label>" +
                '<strong class="other-row-profit">' +
                money(
                    profit
                ) +
                "</strong>" +
                "</div>" +

                "</div>";

            container.appendChild(
                row
            );
        }
    );
}


/* ---------------------------------------------------------
   UPDATE OTHER ITEM QUANTITY
--------------------------------------------------------- */

function updateSalesOtherQuantity(input) {

    const row =
        input.closest(
            ".sales-row"
        );

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

    if (
        !record ||
        !Array.isArray(record.otherItems)
    ) {
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
        numberValue(
            input.value
        );

    const sales =
        item.quantitySold *
        numberValue(
            item.sellingPrice
        );

    const cost =
        item.quantitySold *
        numberValue(
            item.costPerItem
        );

    const profit =
        sales - cost;

    const salesElement =
        row.querySelector(
            ".other-row-sales"
        );

    const costElement =
        row.querySelector(
            ".other-row-cost"
        );

    const profitElement =
        row.querySelector(
            ".other-row-profit"
        );

    if (salesElement) {
        salesElement.textContent =
            money(sales);
    }

    if (costElement) {
        costElement.textContent =
            money(cost);
    }

    if (profitElement) {
        profitElement.textContent =
            money(profit);
    }

    saveAllData();

    calculateSalesTotals();
}
    const date =
        document.getElementById(
            "salesDate"
        ).value;

    const record =
        getSavedDailySales(date);

    if (
        !record ||
        !Array.isArray(
            record.otherItems
        )
    ) {
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
        numberValue(
            input.value
        );

    const sales =
        item.quantitySold *
        numberValue(
            item.sellingPrice
        );

    const cost =
        item.quantitySold *
        numberValue(
            item.unitCost
        );

    const profit =
        sales - cost;

    const rowSales =
        row.querySelector(
            ".row-sales"
        );

    const rowCost =
        row.querySelector(
            ".row-cost"
        );

    const rowProfit =
        row.querySelector(
            ".row-profit"
        );

    if (rowSales) {

        rowSales.textContent =
            money(sales);
    }

    if (rowCost) {

        rowCost.textContent =
            money(cost);
    }

    if (rowProfit) {

        rowProfit.textContent =
            money(profit);
    }

    saveAllData();

    calculateSalesTotals();
}


/* ---------------------------------------------------------
   DELETE OTHER ITEM
--------------------------------------------------------- */

function deleteSalesOtherItem(rowId) {

    const date =
        document.getElementById(
            "salesDate"
        ).value;

    const record =
        getSavedDailySales(date);

    if (
        !record ||
        !Array.isArray(
            record.otherItems
        )
    ) {
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

    const dateInput =
        document.getElementById(
            "salesDate"
        );

    if (!dateInput) {
        return;
    }

    const date =
        dateInput.value;

    const record =
        getSavedDailySales(date);

    let foodSales = 0;
    let otherSales = 0;
    let foodCost = 0;
    let otherCost = 0;

    if (
        record &&
        Array.isArray(
            record.foodItems
        )
    ) {

        record.foodItems.forEach(
            function(item) {

                const quantity =
                    numberValue(
                        item.quantitySold
                    );

                const sellingPrice =
                    numberValue(
                        item.sellingPrice
                    );

                const costPerServing =
                    numberValue(
                        item.costPerServing
                    );

                foodSales +=
                    quantity *
                    sellingPrice;

                foodCost +=
                    quantity *
                    costPerServing;
            }
        );
    }

    if (
        record &&
        Array.isArray(
            record.otherItems
        )
    ) {

        record.otherItems.forEach(
            function(item) {

                const quantity =
                    numberValue(
                        item.quantitySold
                    );

                const sellingPrice =
                    numberValue(
                        item.sellingPrice
                    );

                const unitCost =
                    numberValue(
                        item.unitCost
                    );

                otherSales +=
                    quantity *
                    sellingPrice;

                otherCost +=
                    quantity *
                    unitCost;
            }
        );
    }

    const totalSales =
        foodSales +
        otherSales;

    const totalCost =
        foodCost +
        otherCost;

    const grossProfit =
        totalSales -
        totalCost;

    if (record) {

        record.foodSales =
            foodSales;

        record.otherSales =
            otherSales;

        record.totalSales =
            totalSales;

        record.foodCost =
            foodCost;

        record.otherCost =
            otherCost;

        record.totalCost =
            totalCost;

        record.grossProfit =
            grossProfit;

        record.profit =
            grossProfit;
    }

    const foodSalesElement =
        document.getElementById(
            "salesFoodTotal"
        );

    const otherSalesElement =
        document.getElementById(
            "salesOtherTotal"
        );

    const totalSalesElement =
        document.getElementById(
            "salesTotal"
        );

    const foodCostElement =
        document.getElementById(
            "salesFoodCost"
        );

    const otherCostElement =
        document.getElementById(
            "salesOtherCost"
        );

    const totalCostElement =
        document.getElementById(
            "salesTotalCost"
        );

    const grossProfitElement =
        document.getElementById(
            "salesGrossProfit"
        );

    if (foodSalesElement) {

        foodSalesElement.textContent =
            money(foodSales);
    }

    if (otherSalesElement) {

        otherSalesElement.textContent =
            money(otherSales);
    }

    if (totalSalesElement) {

        totalSalesElement.textContent =
            money(totalSales);
    }

    if (foodCostElement) {

        foodCostElement.textContent =
            money(foodCost);
    }

    if (otherCostElement) {

        otherCostElement.textContent =
            money(otherCost);
    }

    if (totalCostElement) {

        totalCostElement.textContent =
            money(totalCost);
    }

    if (grossProfitElement) {

        grossProfitElement.textContent =
            money(grossProfit);
    }

    if (record) {
        saveAllData();
    }

    return {
        foodSales:
            foodSales,

        otherSales:
            otherSales,

        totalSales:
            totalSales,

        foodCost:
            foodCost,

        otherCost:
            otherCost,

        totalCost:
            totalCost,

        grossProfit:
            grossProfit
    };
}
        return sorted[0];

    return null;
}


/* ---------------------------------------------------------
   LOAD PROFIT CALCULATOR
--------------------------------------------------------- */

function loadProfitCalculator() {

    const dateInput =
        document.getElementById(
            "profitDate"
        );

    if (!dateInput) {
        return;
    }

    if (!dateInput.value) {
        dateInput.value =
            todayString();
    }

    const date =
        dateInput.value;

    const salesRecord =
        getSavedDailySales(date);

    const previousRecord =
        getPreviousProfitRecord(date);

    const foodSales =
        salesRecord
            ? numberValue(
                salesRecord.foodSales
            )
            : 0;

    const otherSales =
        salesRecord
            ? numberValue(
                salesRecord.otherSales
            )
            : 0;

    const totalSales =
        foodSales +
        otherSales;

    const foodCost =
        salesRecord
            ? numberValue(
                salesRecord.foodCost
            )
            : 0;

    const otherCost =
        salesRecord
            ? numberValue(
                salesRecord.otherCost
            )
            : 0;

    const totalCost =
        foodCost +
        otherCost;

    const grossProfit =
        totalSales -
        totalCost;

    setProfitValue(
        "profitFoodSales",
        foodSales
    );

    setProfitValue(
        "profitOtherSales",
        otherSales
    );

    setProfitValue(
        "profitTotalSales",
        totalSales
    );

    setProfitValue(
        "profitFoodCost",
        foodCost
    );

    setProfitValue(
        "profitOtherCost",
        otherCost
    );

    setProfitValue(
        "profitTotalCost",
        totalCost
    );

    setProfitValue(
        "profitGrossProfit",
        grossProfit
    );

    const record =
        profitRecords.find(
            function(item) {
                return item.date === date;
            }
        );

    if (record) {

        setExpenseInput(
            "profitRent",
            record.rent
        );

        setExpenseInput(
            "profitGas",
            record.gas
        );

        setExpenseInput(
            "profitElectricity",
            record.electricity
        );

        setExpenseInput(
            "profitWater",
            record.water
        );

        setExpenseInput(
            "profitWifi",
            record.wifi
        );

        setExpenseInput(
            "profitLabor",
            record.labor
        );

        setExpenseInput(
            "profitOtherExpenses",
            record.otherExpenses
        );

    } else if (previousRecord) {

        setExpenseInput(
            "profitRent",
            previousRecord.rent
        );

        setExpenseInput(
            "profitGas",
            previousRecord.gas
        );

        setExpenseInput(
            "profitElectricity",
            previousRecord.electricity
        );

        setExpenseInput(
            "profitWater",
            previousRecord.water
        );

        setExpenseInput(
            "profitWifi",
            previousRecord.wifi
        );

        setExpenseInput(
            "profitLabor",
            previousRecord.labor
        );

        setExpenseInput(
            "profitOtherExpenses",
            previousRecord.otherExpenses
        );
    }

    calculateProfitTotals();
}


/* ---------------------------------------------------------
   PROFIT VALUE HELPERS
--------------------------------------------------------- */

function setProfitValue(
    id,
    value
) {

    const element =
        document.getElementById(id);

    if (!element) {
        return;
    }

    element.textContent =
        money(
            numberValue(value)
        );
}


function setExpenseInput(
    id,
    value
) {

    const element =
        document.getElementById(id);

    if (!element) {
        return;
    }

    element.value =
        numberValue(value);
}


/* ---------------------------------------------------------
   CALCULATE PROFIT TOTALS
--------------------------------------------------------- */

function calculateProfitTotals() {

    const dateInput =
        document.getElementById(
            "profitDate"
        );

    if (!dateInput) {
        return;
    }

    const date =
        dateInput.value;

    const salesRecord =
        getSavedDailySales(date);

    const foodSales =
        salesRecord
            ? numberValue(
                salesRecord.foodSales
            )
            : 0;

    const otherSales =
        salesRecord
            ? numberValue(
                salesRecord.otherSales
            )
            : 0;

    const totalSales =
        foodSales +
        otherSales;

    const foodCost =
        salesRecord
            ? numberValue(
                salesRecord.foodCost
            )
            : 0;

    const otherCost =
        salesRecord
            ? numberValue(
                salesRecord.otherCost
            )
            : 0;

    const totalCost =
        foodCost +
        otherCost;

    const grossProfit =
        totalSales -
        totalCost;

    const rent =
        numberValue(
            document.getElementById(
                "profitRent"
            )?.value
        );

    const gas =
        numberValue(
            document.getElementById(
                "profitGas"
            )?.value
        );

    const electricity =
        numberValue(
            document.getElementById(
                "profitElectricity"
            )?.value
        );

    const water =
        numberValue(
            document.getElementById(
                "profitWater"
            )?.value
        );

    const wifi =
        numberValue(
            document.getElementById(
                "profitWifi"
            )?.value
        );

    const labor =
        numberValue(
            document.getElementById(
                "profitLabor"
            )?.value
        );

    const otherExpenses =
        numberValue(
            document.getElementById(
                "profitOtherExpenses"
            )?.value
        );

    const totalExpenses =
        rent +
        gas +
        electricity +
        water +
        wifi +
        labor +
        otherExpenses;

    const netProfit =
        grossProfit -
        totalExpenses;

    setProfitValue(
        "profitFoodSales",
        foodSales
    );

    setProfitValue(
        "profitOtherSales",
        otherSales
    );

    setProfitValue(
        "profitTotalSales",
        totalSales
    );

    setProfitValue(
        "profitFoodCost",
        foodCost
    );

    setProfitValue(
        "profitOtherCost",
        otherCost
    );

    setProfitValue(
        "profitTotalCost",
        totalCost
    );

    setProfitValue(
        "profitGrossProfit",
        grossProfit
    );

    setProfitValue(
        "profitTotalExpenses",
        totalExpenses
    );

    setProfitValue(
        "profitNetProfit",
        netProfit
    );

    return {
        foodSales:
            foodSales,

        otherSales:
            otherSales,

        totalSales:
            totalSales,

        foodCost:
            foodCost,

        otherCost:
            otherCost,

        totalCost:
            totalCost,

        grossProfit:
            grossProfit,

        totalExpenses:
            totalExpenses,

        netProfit:
            netProfit
    };
}


/* ---------------------------------------------------------
   SAVE PROFIT RECORD
--------------------------------------------------------- */

function saveProfitRecord() {

    const date =
        document.getElementById(
            "profitDate"
        ).value;

    if (!date) {
        return;
    }

    const totals =
        calculateProfitTotals();

    if (!totals) {
        return;
    }

    const record = {

        id:
            createSalesRowId(),

        date:
            date,

        foodSales:
            totals.foodSales,

        otherSales:
            totals.otherSales,

        totalSales:
            totals.totalSales,

        foodCost:
            totals.foodCost,

        otherCost:
            totals.otherCost,

        totalCost:
            totals.totalCost,

        grossProfit:
            totals.grossProfit,

        rent:
            numberValue(
                document.getElementById(
                    "profitRent"
                )?.value
            ),

        gas:
            numberValue(
                document.getElementById(
                    "profitGas"
                )?.value
            ),

        electricity:
            numberValue(
                document.getElementById(
                    "profitElectricity"
                )?.value
            ),

        water:
            numberValue(
                document.getElementById(
                    "profitWater"
                )?.value
            ),

        wifi:
            numberValue(
                document.getElementById(
                    "profitWifi"
                )?.value
            ),

        labor:
            numberValue(
                document.getElementById(
                    "profitLabor"
                )?.value
            ),

        otherExpenses:
            numberValue(
                document.getElementById(
                    "profitOtherExpenses"
                )?.value
            ),

        totalExpenses:
            totals.totalExpenses,

        netProfit:
            totals.netProfit
    };

    const existing =
        profitRecords.find(
            function(item) {
                return item.date === date;
            }
        );

    if (existing) {

        Object.assign(
            existing,
            record,
            {
                id: existing.id
            }
        );

    } else {

        profitRecords.push(
            record
        );
    }

    saveAllData();

    showMessage(
        "profitMessage",
        "Profit record saved successfully.",
        "success"
    );

    updateDashboard();
}
        totalCost:
            result.totalCost,

        grossProfit:
            result.grossProfit,

        expenses:
            expenses,

        netProfit:
            result.netProfit
    };

    const existing =
        profitRecords.find(
            function(item) {
                return item.date === date;
            }
        );

    if (existing) {

        Object.assign(
            existing,
            record,
            {
                id: existing.id
            }
        );

    } else {

        profitRecords.push(record);
    }

    saveAllData();

    showMessage(
        "profitMessage",
        "Profit record saved successfully.",
        "success"
    );

    updateDashboard();
}


/* =========================================================
   DASHBOARD
========================================================= */

function updateDashboard() {

    const totalSales =
        dailySalesRecords.reduce(
            function(sum, record) {

                return sum +
                    numberValue(
                        record.totalSales
                    );
            },
            0
        );

    const totalCost =
        dailySalesRecords.reduce(
            function(sum, record) {

                return sum +
                    numberValue(
                        record.totalCost
                    );
            },
            0
        );

    const grossProfit =
        dailySalesRecords.reduce(
            function(sum, record) {

                return sum +
                    numberValue(
                        record.grossProfit
                    );
            },
            0
        );

    const totalExpenses =
        profitRecords.reduce(
            function(sum, record) {

                if (record.expenses) {

                    return sum +
                        numberValue(
                            record.expenses.rent
                        ) +
                        numberValue(
                            record.expenses.gas
                        ) +
                        numberValue(
                            record.expenses.electricity
                        ) +
                        numberValue(
                            record.expenses.water
                        ) +
                        numberValue(
                            record.expenses.wifi
                        ) +
                        numberValue(
                            record.expenses.labor
                        ) +
                        numberValue(
                            record.expenses.other
                        );
                }

                return sum;
            },
            0
        );

    const netProfit =
        grossProfit -
        totalExpenses;

    const dashboardSales =
        document.getElementById(
            "dashboardSales"
        );

    if (dashboardSales) {

        dashboardSales.textContent =
            money(totalSales);
    }

    const dashboardCost =
        document.getElementById(
            "dashboardCost"
        );

    if (dashboardCost) {

        dashboardCost.textContent =
            money(totalCost);
    }

    const dashboardGrossProfit =
        document.getElementById(
            "dashboardGrossProfit"
        );

    if (dashboardGrossProfit) {

        dashboardGrossProfit.textContent =
            money(grossProfit);
    }

    const dashboardExpenses =
        document.getElementById(
            "dashboardExpenses"
        );

    if (dashboardExpenses) {

        dashboardExpenses.textContent =
            money(totalExpenses);
    }

    const dashboardNetProfit =
        document.getElementById(
            "dashboardNetProfit"
        );

    if (dashboardNetProfit) {

        dashboardNetProfit.textContent =
            money(netProfit);
    }
}


/* =========================================================
   RECORDS
========================================================= */

function loadRecordsScreen() {

    renderDailySalesRecords();
    renderProfitRecords();
}


function renderDailySalesRecords() {

    const container =
        document.getElementById(
            "dailySalesRecordsList"
        );

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (
        !Array.isArray(
            dailySalesRecords
        ) ||
        dailySalesRecords.length === 0
    ) {

        container.innerHTML =
            '<div class="empty-state">No Daily Sales records yet.</div>';

        return;
    }

    const sorted =
        dailySalesRecords
            .slice()
            .sort(
                function(a, b) {

                    return b.date.localeCompare(
                        a.date
                    );
                }
            );

    sorted.forEach(
        function(record) {

            const row =
                document.createElement(
                    "div"
                );

            row.className =
                "record-row";

            row.innerHTML =
                '<div>' +
                '<strong>' +
                escapeHtml(
                    record.date
                ) +
                '</strong>' +
                '</div>' +

                '<div>' +
                money(
                    record.totalSales
                ) +
                '</div>' +

                '<div>' +
                money(
                    record.grossProfit
                ) +
                '</div>';

            container.appendChild(row);
        }
    );
}


function renderProfitRecords() {

    const container =
        document.getElementById(
            "profitRecordsList"
        );

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (
        !Array.isArray(
            profitRecords
        ) ||
        profitRecords.length === 0
    ) {

        container.innerHTML =
            '<div class="empty-state">No Profit records yet.</div>';

        return;
    }

    const sorted =
        profitRecords
            .slice()
            .sort(
                function(a, b) {

                    return b.date.localeCompare(
                        a.date
                    );
                }
            );

    sorted.forEach(
        function(record) {

            let totalExpenses = 0;

            if (record.expenses) {

                totalExpenses =
                    numberValue(
                        record.expenses.rent
                    ) +
                    numberValue(
                        record.expenses.gas
                    ) +
                    numberValue(
                        record.expenses.electricity
                    ) +
                    numberValue(
                        record.expenses.water
                    ) +
                    numberValue(
                        record.expenses.wifi
                    ) +
                    numberValue(
                        record.expenses.labor
                    ) +
                    numberValue(
                        record.expenses.other
                    );
            }

            const row =
                document.createElement(
                    "div"
                );

            row.className =
                "record-row";

            row.innerHTML =
                '<div>' +
                '<strong>' +
                escapeHtml(
                    record.date
                ) +
                '</strong>' +
                '</div>' +

                '<div>' +
                money(
                    record.totalSales
                ) +
                '</div>' +

                '<div>' +
                money(
                    totalExpenses
                ) +
                '</div>' +

                '<div>' +
                money(
                    record.netProfit
                ) +
                '</div>';

            container.appendChild(row);
        }
    );
}


/* =========================================================
   MONTHLY RECORDS
========================================================= */

function getMonthName(
    month
) {

    const names = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December"
    ];

    return names[
        numberValue(month)
    ];
}


function renderMonthlyRecords() {

    const container =
        document.getElementById(
            "monthlyRecordsList"
        );

    if (!container) {
        return;
    }

    container.innerHTML = "";

    const monthly = {};

    dailySalesRecords.forEach(
        function(record) {

            if (!record.date) {
                return;
            }

            const key =
                record.date.substring(
                    0,
                    7
                );

            if (!monthly[key]) {

                monthly[key] = {
                    sales: 0,
                    cost: 0,
                    grossProfit: 0
                };
            }

            monthly[key].sales +=
                numberValue(
                    record.totalSales
                );

            monthly[key].cost +=
                numberValue(
                    record.totalCost
                );

            monthly[key].grossProfit +=
                numberValue(
                    record.grossProfit
                );
        }
    );

    const keys =
        Object.keys(monthly).sort(
            function(a, b) {
                return b.localeCompare(a);
            }
        );

    if (keys.length === 0) {

        container.innerHTML =
            '<div class="empty-state">No monthly records yet.</div>';

        return;
    }

    keys.forEach(
        function(key) {

            const parts =
                key.split("-");

            const year =
                parts[0];

            const month =
                numberValue(parts[1]) - 1;

            const data =
                monthly[key];

            const row =
                document.createElement(
                    "div"
                );

            row.className =
                "record-row";

            row.innerHTML =
                '<div>' +
                '<strong>' +
                getMonthName(month) +
                " " +
                escapeHtml(year) +
                '</strong>' +
                '</div>' +

                '<div>' +
                money(data.sales) +
                '</div>' +

                '<div>' +
                money(data.cost) +
                '</div>' +

                '<div>' +
                money(data.grossProfit) +
                '</div>';

            container.appendChild(row);
        }
    );
}
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
                     content.style.display =
                    content.style.display === "none"
                        ? "block"
                        : "none";
                };

            folder.appendChild(header);
            folder.appendChild(content);

            datesInMonth.forEach(
                function(date) {

                    const sales =
                        dailySalesRecords.find(
                            function(record) {
                                return record.date === date;
                            }
                        );

                    const profit =
                        profitRecords.find(
                            function(record) {
                                return record.date === date;
                            }
                        );

                    const row =
                        document.createElement("div");

                    row.className =
                        "record-row";

                    const salesAmount =
                        sales
                            ? numberValue(
                                sales.totalSales
                            )
                            : 0;

                    const grossProfit =
                        sales
                            ? numberValue(
                                sales.grossProfit
                            )
                            : 0;

                    const expenses =
                        profit
                            ? numberValue(
                                profit.totalExpenses
                            )
                            : 0;

                    const netProfit =
                        profit
                            ? numberValue(
                                profit.netProfit
                            )
                            : grossProfit;

                    row.innerHTML =
                        '<div>' +
                        '<strong>' +
                        escapeHtml(date) +
                        '</strong>' +
                        '</div>' +

                        '<div>' +
                        '<small>Sales</small><br>' +
                        money(salesAmount) +
                        '</div>' +

                        '<div>' +
                        '<small>Gross Profit</small><br>' +
                        money(grossProfit) +
                        '</div>' +

                        '<div>' +
                        '<small>Expenses</small><br>' +
                        money(expenses) +
                        '</div>' +

                        '<div>' +
                        '<small>Net Profit</small><br>' +
                        money(netProfit) +
                        '</div>';

                    content.appendChild(row);
                }
            );

            container.appendChild(folder);
        }
    );
}


/* ---------------------------------------------------------
   RECORDS SCREEN REFRESH
--------------------------------------------------------- */

function refreshRecordsScreen() {

    renderMonthlyRecords();
}


/* ---------------------------------------------------------
   DASHBOARD SCREEN REFRESH
--------------------------------------------------------- */

function refreshDashboardScreen() {

    updateDashboard();
}


/* ---------------------------------------------------------
   MENU SCREEN REFRESH
--------------------------------------------------------- */

function refreshMenuScreen() {

    loadMenuOfDay();
}


/* ---------------------------------------------------------
   DAILY SALES SCREEN REFRESH
--------------------------------------------------------- */

function refreshSalesScreen() {

    loadDailySales();
}


/* ---------------------------------------------------------
   PROFIT SCREEN REFRESH
--------------------------------------------------------- */

function refreshProfitScreen() {

    loadProfitCalculator();
}


/* =========================================================
   GENERAL SCREEN REFRESH
========================================================= */

function refreshAllScreens() {

    try {
        updateDashboard();
    } catch (error) {
        console.error(
            "Dashboard refresh error:",
            error
        );
    }

    try {
        renderMonthlyRecords();
    } catch (error) {
        console.error(
            "Records refresh error:",
            error
        );
    }

    try {
        loadMenuOfDay();
    } catch (error) {
        console.error(
            "Menu refresh error:",
            error
        );
    }

    try {
        loadDailySales();
    } catch (error) {
        console.error(
            "Sales refresh error:",
            error
        );
    }

    try {
        loadProfitCalculator();
    } catch (error) {
        console.error(
            "Profit refresh error:",
            error
        );
    }
}


/* =========================================================
   FORM HELPERS
========================================================= */

function clearInput(id) {

    const element =
        document.getElementById(id);

    if (element) {
        element.value = "";
    }
}


function setInputValue(
    id,
    value
) {

    const element =
        document.getElementById(id);

    if (element) {
        element.value =
            value === undefined ||
            value === null
                ? ""
                : value;
    }
}


/* =========================================================
   DATE CHANGE HANDLERS
========================================================= */

function handleRecipeDateChange() {

    const date =
        document.getElementById(
            "recipeDate"
        ).value;

    if (
        document.getElementById(
            "savedRecipeDate"
        )
    ) {
        document.getElementById(
            "savedRecipeDate"
        ).value = date;
    }

    loadSavedRecipes();
}


function handleMenuDateChange() {

    loadMenuOfDay();
}


function handleSalesDateChange() {

    currentSalesSoldOutFoodIds = [];

    loadDailySales();
}


function handleProfitDateChange() {

    loadProfitCalculator();
}
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

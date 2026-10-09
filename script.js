/* ================================================================
   KARINDERYA KALKULATOR — DAILY PROFIT CALCULATOR CORRECTED FINAL
   Built on the working Karinderya_Kalkulator_PROFIT_OPEX_PREMIUM_V3.js

   AGREED DESIGN
   1. Top cards: Cooked Food Sales / Other Items Sold / OPEX
   2. Below: Capital Cost / Number of Sales / Profit
   3. Food Capital Cost = Recipe Cost ONCE per recipe/menu item
      (never multiplied by servings sold)
   4. Other Item Capital Cost = Unit Cost x Quantity Sold
   5. Profit = Total Sales - Total Capital Cost - Daily OPEX
   6. OPEX: Rent / Electricity / Water / WiFi / Gas-LPG / Labor / Other / Total OPEX
   7. Rent/Electricity/Water/WiFi are recurring monthly values divided by 30.
   8. Monthly values are carried forward until changed; historical records keep snapshots.
   9. Gas/LPG and Other are daily values.
  10. Labor is calculated only from employees marked Present.
  11. Monthly cards use Edit -> Update. No manual Labor input.
   ================================================================ */

/* The source below is the previously working V3 script. */
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
let editingMenuRecipeId = null;
let ingredientRenderRequest = 0;
let otherItemRenderRequest = 0;

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

const masterOtherItems = [];


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

function showScreen(screenId) {

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

    /* Always refresh cloud ingredients before opening Recipe Cost.
       This guarantees newly saved ingredients are immediately available
       in the recipe ingredient dropdown. */
    if (screenId === "recipeScreen" && currentUserId) {
        renderIngredientList().then(function(){
            refreshRecipeIngredientDropdowns();
            calculateRecipeTotal();
        });
    }

    if (screenId === "ingredientScreen") {
        populateMasterIngredientSelect();
        populateMasterOtherItemSelect();
        renderIngredientList();
        renderOtherItemList();
    }

    if (screenId === "recipeScreen") {
        loadRecipeScreen();
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

function populateMasterIngredientSelect(keepName){
    const select=document.getElementById("ingredientName");
    if(!select)return;
    const current=keepName!==undefined&&keepName!==null?String(keepName):String(select.value||"");
    const savedNames=new Set(ingredientPrices.map(x=>String(x.name||"").trim().toLowerCase()));
    select.innerHTML='<option value="">Select ingredient...</option>';
    masterIngredients.forEach(function(name){
        const lower=String(name).toLowerCase();
        if(name!=="__custom__"&&savedNames.has(lower)&&lower!==current.toLowerCase())return;
        const o=document.createElement("option");
        o.value=name;
        o.textContent=name==="__custom__"?"➕ Add Custom Ingredient":name;
        select.appendChild(o);
    });
    if(current)select.value=current;
}
function populateMasterOtherItemSelect(keepName){const input=document.getElementById("otherItemName");if(!input)return;if(keepName!==undefined&&keepName!==null)input.value=keepName;}

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

async function saveIngredient(editId) {
    const selected = document.getElementById("ingredientName").value;
    let name = selected;
    if (selected === "__custom__") name = document.getElementById("customIngredientName").value.trim();
    const purchasePrice = numberValue(document.getElementById("ingredientPurchasePrice").value);
    const quantity = numberValue(document.getElementById("ingredientQuantity").value);
    const unit = document.getElementById("ingredientUnit").value;
    if (!name || purchasePrice <= 0 || quantity <= 0) {
        showMessage("ingredientMessage", "Please enter a valid ingredient, purchase price and quantity.", "error"); return;
    }
    const unitCost = purchasePrice / quantity;
    const duplicate = ingredientPrices.find(x => x.name.toLowerCase() === name.toLowerCase() && String(x.id) !== String(editId || ""));
    if (duplicate) { showMessage("ingredientMessage", "This ingredient is already in your saved list. Edit the existing item instead.", "error"); return; }
    const userId = await getCurrentUserId();
    if (!userId) return;
    let error;
    if (editId) {
        ({error} = await supabaseClient.from("ingredients").update({name,purchase_price:purchasePrice,quantity,unit,unit_cost:unitCost}).eq("id",Number(editId)).eq("user_id",userId));
    } else {
        ({error} = await supabaseClient.from("ingredients").insert({user_id:userId,name,purchase_price:purchasePrice,quantity,unit,unit_cost:unitCost}));
    }
    if (error) { console.error(error); showMessage("ingredientMessage", "Unable to save ingredient.", "error"); return; }
    await renderIngredientList();
    clearIngredientForm();
    showMessage("ingredientMessage", editId ? "Ingredient updated successfully." : "Ingredient saved successfully.", "success");
}

function clearIngredientForm(){
    ["ingredientPurchasePrice","ingredientQuantity","customIngredientName"].forEach(function(id){
        const e=document.getElementById(id);
        if(e)e.value="";
    });
    const n=document.getElementById("ingredientName");
    if(n){
        n.value="";
        /* Rebuild AFTER clearing the current value.
           Otherwise the just-saved ingredient remains in the dropdown
           until the next ingredient is saved. */
        populateMasterIngredientSelect("");
    }
    const b=document.querySelector('#ingredientScreen button[onclick^="saveIngredient"]');
    if(b){
        b.textContent="Save Ingredient";
        b.onclick=function(){saveIngredient();};
    }
    handleCustomIngredient();
}

function editIngredient(id){
    const item=ingredientPrices.find(x=>String(x.id)===String(id)); if(!item)return;
    document.getElementById("ingredientName").value=item.name;
    document.getElementById("ingredientPurchasePrice").value=item.purchasePrice;
    document.getElementById("ingredientQuantity").value=item.quantity;
    document.getElementById("ingredientUnit").value=item.unit;
    const b=document.querySelector('#ingredientScreen button[onclick^="saveIngredient"]');
    if(b){b.textContent="Update Ingredient";b.onclick=()=>saveIngredient(id);}
    showScreen("ingredientScreen"); populateMasterIngredientSelect(item.name); handleCustomIngredient(); window.scrollTo(0,0);
}

async function renderIngredientList() {
    const container=document.getElementById("ingredientList");
    if(!container)return;
    const requestId=++ingredientRenderRequest;
    const userId=await getCurrentUserId();
    if(!userId)return;
    const {data,error}=await supabaseClient.from("ingredients").select("*").eq("user_id",userId).order("created_at",{ascending:false});
    if(requestId!==ingredientRenderRequest)return;
    if(error){console.error(error);container.innerHTML='<div class="empty">Unable to load saved ingredients.</div>';return;}
    ingredientPrices=(data||[]).map(function(x){return {id:String(x.id),name:x.name,purchasePrice:numberValue(x.purchase_price),quantity:numberValue(x.quantity),unit:x.unit||"",unitCost:numberValue(x.unit_cost)};});
    container.innerHTML=ingredientPrices.length?"":'<div class="empty">No ingredients saved yet.</div>';
    ingredientPrices.forEach(function(item){
        const div=document.createElement("div");
        div.className="list-item saved-row";
        div.innerHTML='<div class="saved-row-main"><strong>'+escapeHtml(item.name)+'</strong><span>'+money(item.purchasePrice)+' / '+item.quantity+' '+escapeHtml(item.unit)+'</span></div><div class="saved-row-actions"><button class="btn btn-secondary btn-small" onclick="editIngredient(\''+item.id+'\')">Edit</button><button class="btn btn-danger btn-small" onclick="deleteIngredient(\''+item.id+'\')">Delete</button></div>';
        container.appendChild(div);
    });
    populateMasterIngredientSelect();
}
async function deleteIngredient(id){
    if(!confirm("Delete this ingredient?"))return;
    const {error}=await supabaseClient.from("ingredients").delete().eq("id",Number(id)).eq("user_id",currentUserId);
    if(error){showMessage("ingredientMessage","Unable to delete ingredient.","error");return;}
    await renderIngredientList();
}

async function saveOtherItem(editId){
    const selected=document.getElementById("otherItemName").value; let name=selected;
    if(selected==="__custom__")name=document.getElementById("customOtherItemName").value.trim();
    const purchasePrice=numberValue(document.getElementById("otherPurchasePrice").value), quantity=numberValue(document.getElementById("otherQuantity").value), unit=document.getElementById("otherUnit").value.trim(), sellingPrice=numberValue(document.getElementById("otherSellingPrice").value);
    if(!name||purchasePrice<=0||quantity<=0||sellingPrice<=0){showMessage("otherItemMessage","Please enter valid other item details.","error");return;}
    const duplicate=otherItems.find(x=>x.name.toLowerCase()===name.toLowerCase()&&String(x.id)!==String(editId||"")); if(duplicate){showMessage("otherItemMessage","This item is already saved. Edit the existing item instead.","error");return;}
    const unitCost=purchasePrice/quantity,userId=await getCurrentUserId(); if(!userId)return;
    let error;
    if(editId)({error}=await supabaseClient.from("other_items").update({name,purchase_price:purchasePrice,quantity,unit,unit_cost:unitCost,selling_price:sellingPrice}).eq("id",Number(editId)).eq("user_id",userId));
    else ({error}=await supabaseClient.from("other_items").insert({user_id:userId,name,purchase_price:purchasePrice,quantity,unit,unit_cost:unitCost,selling_price:sellingPrice}));
    if(error){console.error(error);showMessage("otherItemMessage","Unable to save other item.","error");return;}
    await renderOtherItemList(); clearOtherItemForm(); showMessage("otherItemMessage",editId?"Other item updated successfully.":"Other item saved successfully.","success");
}
function clearOtherItemForm(){["otherPurchasePrice","otherQuantity","otherUnit","otherSellingPrice","customOtherItemName"].forEach(id=>{const e=document.getElementById(id);if(e)e.value=""});const e=document.getElementById("otherItemName");if(e)e.value="";const b=document.querySelector('#otherItemScreen button[onclick^="saveOtherItem"]');if(b){b.textContent="Save Other Item";b.onclick=()=>saveOtherItem();}handleCustomOtherItem();}
function editOtherItem(id){const item=otherItems.find(x=>String(x.id)===String(id));if(!item)return;document.getElementById("otherItemName").value=item.name;document.getElementById("otherPurchasePrice").value=item.purchasePrice;document.getElementById("otherQuantity").value=item.quantity;document.getElementById("otherUnit").value=item.unit;document.getElementById("otherSellingPrice").value=item.sellingPrice;const b=document.querySelector('#otherItemScreen button[onclick^="saveOtherItem"]');if(b){b.textContent="Update Other Item";b.onclick=()=>saveOtherItem(id);}showScreen("otherItemScreen");populateMasterOtherItemSelect(item.name);handleCustomOtherItem();window.scrollTo(0,0);}
async function renderOtherItemList(){const c=document.getElementById("otherItemList");if(!c)return;const userId=await getCurrentUserId();if(!userId)return;const {data,error}=await supabaseClient.from("other_items").select("*").eq("user_id",userId).order("created_at",{ascending:false});if(error){c.innerHTML='<div class="empty">Unable to load saved other items.</div>';return;}otherItems=(data||[]).map(x=>({id:String(x.id),name:x.name,purchasePrice:numberValue(x.purchase_price),quantity:numberValue(x.quantity),unit:x.unit||"",unitCost:numberValue(x.unit_cost),sellingPrice:numberValue(x.selling_price)}));c.innerHTML=otherItems.length?"":'<div class="empty">No other items saved yet.</div>';otherItems.forEach(item=>{const d=document.createElement("div");d.className="list-item saved-row";d.innerHTML='<div class="saved-row-main"><strong>'+escapeHtml(item.name)+'</strong><span>Purchase '+money(item.purchasePrice)+' | Sell '+money(item.sellingPrice)+'</span></div><div class="saved-row-actions"><button class="btn btn-secondary btn-small" onclick="editOtherItem(\''+item.id+'\')">Edit</button><button class="btn btn-danger btn-small" onclick="deleteOtherItem(\''+item.id+'\')">Delete</button></div>';c.appendChild(d);});populateMasterOtherItemSelect();}
async function deleteOtherItem(id){if(!confirm("Delete this other item?"))return;const {error}=await supabaseClient.from("other_items").delete().eq("id",Number(id)).eq("user_id",currentUserId);if(error){showMessage("otherItemMessage","Unable to delete other item.","error");return;}await renderOtherItemList();}

/* =========================================================
   RECIPE
========================================================= */

async function loadRecipeScreen() {

    /* Always refresh Ingredients from Supabase before building the Recipe dropdowns.
       This prevents a newly saved ingredient from being missing until a later refresh. */
    await renderIngredientList();

    const dateInput =
        document.getElementById("recipeDate");

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


function getRecipeSelectedIngredientIds(){return Array.from(document.querySelectorAll(".recipe-ingredient-select")).map(e=>String(e.value)).filter(Boolean);}
function addRecipeIngredient(){
    const c=document.getElementById("recipeIngredients");
    if(!c)return;
    const row=document.createElement("div");
    row.className="recipe-ingredient-row";
    row.innerHTML='<div><select class="recipe-ingredient-select" aria-label="Ingredient" onchange="calculateRecipeTotal();refreshRecipeIngredientDropdowns()"><option value="">Select ingredient...</option></select></div><div><input type="number" class="recipe-amount" aria-label="Amount" min="0" step="0.001" placeholder="Amount" oninput="calculateRecipeTotal()"></div><div><select class="recipe-unit" aria-label="Unit" onchange="calculateRecipeTotal()"><option value="kg">kg</option><option value="g">g</option><option value="mg">mg</option><option value="liter">liter</option><option value="ml">ml</option><option value="cup">cup</option><option value="tbsp">tbsp</option><option value="tsp">tsp</option><option value="fl_oz">fl oz</option><option value="pint">pint</option><option value="quart">quart</option><option value="gallon">gallon</option><option value="piece">piece</option><option value="dozen">dozen</option><option value="pinch">pinch</option><option value="dash">dash</option><option value="handful">handful</option><option value="bunch">bunch</option><option value="clove">clove</option><option value="stalk">stalk</option><option value="leaf">leaf</option><option value="pack">pack</option><option value="can">can</option><option value="bottle">bottle</option><option value="slice">slice</option></select></div><button type="button" class="btn btn-danger btn-small" aria-label="Remove ingredient" onclick="removeRecipeIngredient(this)">×</button>';
    c.appendChild(row);
    populateRecipeIngredientSelect(row);
}
function populateRecipeIngredientSelect(row){
    const select=row.querySelector(".recipe-ingredient-select"),current=String(select.value||""),used=getRecipeSelectedIngredientIds().filter(function(id){return id!==current;});
    select.innerHTML='<option value="">Select ingredient...</option>';
    ingredientPrices.forEach(function(item){
        if(used.includes(String(item.id)))return;
        const o=document.createElement("option");o.value=item.id;o.textContent=item.name;select.appendChild(o);
    });
    if(current)select.value=current;
}
function refreshRecipeIngredientDropdowns(){document.querySelectorAll(".recipe-ingredient-row").forEach(function(row){populateRecipeIngredientSelect(row);});}
function removeRecipeIngredient(button){const row=button.closest(".recipe-ingredient-row");if(row)row.remove();if(!document.querySelector("#recipeIngredients .recipe-ingredient-row"))addRecipeIngredient();calculateRecipeTotal();refreshRecipeIngredientDropdowns();}

function getIngredientUnitCost(item){return item?numberValue(item.unitCost):0;}

/* Standard conversions use kg/g/mg for mass, liter/ml/cup/etc. for volume,
   and piece/dozen for count. Weight-to-volume is intentionally not guessed. */
function getUnitDimension(unit){
    const mass={kg:1,g:0.001,mg:0.000001};
    const volume={liter:1,ml:0.001,cup:0.2365882365,tbsp:0.0147867648,tsp:0.00492892159,fl_oz:0.0295735296,pint:0.473176473,quart:0.946352946,gallon:3.785411784};
    const count={piece:1,dozen:12};
    if(Object.prototype.hasOwnProperty.call(mass,unit))return {type:"mass",factor:mass[unit]};
    if(Object.prototype.hasOwnProperty.call(volume,unit))return {type:"volume",factor:volume[unit]};
    if(Object.prototype.hasOwnProperty.call(count,unit))return {type:"count",factor:count[unit]};
    return {type:"other",factor:1};
}
function convertAmount(amount,fromUnit,toUnit){
    amount=numberValue(amount);
    if(fromUnit===toUnit)return amount;
    const from=getUnitDimension(fromUnit),to=getUnitDimension(toUnit);
    if(from.type!==to.type)return null;
    return amount*from.factor/to.factor;
}
function calculateIngredientCost(ingredient,amount,recipeUnit){
    if(!ingredient||amount<=0)return 0;
    const storedUnit=String(ingredient.unit||"");
    const unitCost=getIngredientUnitCost(ingredient);
    if(storedUnit===recipeUnit)return amount*unitCost;
    const converted=convertAmount(amount,recipeUnit,storedUnit);
    if(converted===null)return 0;
    return converted*unitCost;
}
function calculateRecipeTotal(){
    const rows=document.querySelectorAll("#recipeIngredients .recipe-ingredient-row");
    let total=0;
    rows.forEach(function(row){
        const ingredientId=row.querySelector(".recipe-ingredient-select").value;
        const amount=numberValue(row.querySelector(".recipe-amount").value);
        const unit=row.querySelector(".recipe-unit").value;
        const ingredient=ingredientPrices.find(function(item){return String(item.id)===String(ingredientId);});
        if(!ingredient||amount<=0)return;
        total+=calculateIngredientCost(ingredient,amount,unit);
    });
    const totalEl=document.getElementById("recipeTotalCost");
    if(totalEl)totalEl.textContent=money(total);
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
        const ingredientId=row.querySelector(".recipe-ingredient-select").value;
        const amount=numberValue(row.querySelector(".recipe-amount").value);
        const unit=row.querySelector(".recipe-unit").value;
        const ingredient=ingredientPrices.find(function(item){return String(item.id)===String(ingredientId);});
        if(!ingredient||amount<=0)return;
        const cost=calculateIngredientCost(ingredient,amount,unit);
        if(cost<=0)return;
        totalCost+=cost;
        ingredients.push({ingredientId:String(ingredient.id),ingredientName:ingredient.name,amount:amount,unit:unit,cost:cost});
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
        "Recipe saved successfully for this date. It will appear in Today's Menu & Sales for the same date.",
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


function loadSavedRecipes(){const date=document.getElementById("savedRecipeDate").value,container=document.getElementById("savedRecipesList");if(!date){container.innerHTML='<div class="empty">Select a date.</div>';return;}const recipes=savedRecipes.filter(r=>r.date===date);if(!recipes.length){container.innerHTML='<div class="empty">No recipes saved for this date.</div>';return;}container.innerHTML="";recipes.forEach(recipe=>{const d=document.createElement("div");d.className="saved-recipe-row";d.innerHTML='<div class="saved-recipe-name">'+escapeHtml(recipe.name)+'</div><div class="saved-recipe-cost">'+money(recipe.totalCost)+'</div><button class="btn btn-secondary btn-small" onclick="editSavedRecipe(\''+recipe.id+'\')">Edit</button><button class="btn btn-danger btn-small" onclick="deleteSavedRecipe(\''+recipe.id+'\')">Delete</button>';container.appendChild(d);});}
async function editSavedRecipe(id){
    const r=savedRecipes.find(function(x){return String(x.id)===String(id);});
    if(!r)return;

    /* Always refresh the cloud ingredient master before rebuilding the
       recipe. This prevents an edit from opening with empty ingredient
       selections when the cloud list has not finished loading yet. */
    await renderIngredientList();

    document.getElementById("recipeDate").value=r.date||todayString();
    document.getElementById("recipeName").value=r.name||"";

    const container=document.getElementById("recipeIngredients");
    container.innerHTML="";

    const list=Array.isArray(r.ingredients)?r.ingredients:[];
    list.forEach(function(ing){
        addRecipeIngredient();
        const rows=container.querySelectorAll(".recipe-ingredient-row");
        const row=rows[rows.length-1];
        const select=row.querySelector(".recipe-ingredient-select");

        /* Prefer the saved ID. If an older recipe stored a different ID
           type, fall back to the saved ingredient name. */
        populateRecipeIngredientSelect(row);
        let wantedId=String(ing.ingredientId||"");
        let found=Array.from(select.options).some(function(o){return String(o.value)===wantedId;});
        if(!found && ing.ingredientName){
            const match=ingredientPrices.find(function(item){
                return String(item.name).trim().toLowerCase()===String(ing.ingredientName).trim().toLowerCase();
            });
            if(match)wantedId=String(match.id);
        }
        if(wantedId)select.value=wantedId;
        row.querySelector(".recipe-amount").value=ing.amount||"";
        row.querySelector(".recipe-unit").value=ing.unit||"piece";
    });

    if(!list.length)addRecipeIngredient();
    refreshRecipeIngredientDropdowns();
    calculateRecipeTotal();
    showScreen("recipeScreen");
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
    /* Menu of the Day must use ONLY recipes entered for the selected
       Recipe of the Day date. Recipes saved on older or future dates
       must not appear in this dropdown. */
    const selectedDate = String(date || "");
    return savedRecipes.filter(function(recipe) {
        return String(recipe.date || "") === selectedDate;
    });
}

function getSavedMenuForDate(date) {
    return savedMenus.find(function(menu){return String(menu.date)===String(date);});
}

function saveTargetFoodCost(){
    const input=document.getElementById("targetFoodCost");
    const value=numberValue(input.value);
    if(value<=0||value>=100){input.value=targetFoodCost;return;}
    targetFoodCost=value;
    saveAllData();
    refreshMenuCalculations();
}

function loadMenuOfDay(){
    const date=document.getElementById("menuDate");
    if(!date.value)date.value=todayString();
    const target=document.getElementById("targetFoodCost");
    if(target)target.value=targetFoodCost;
    populateMenuRecipeSelect(date.value);
    renderMenuItems(date.value);
    resetMenuEntry(false);
}

function populateMenuRecipeSelect(date){
    const select=document.getElementById("menuRecipeSelect");
    if(!select)return;

    const saved=getSavedMenuForDate(date);
    const used=new Set((saved&&Array.isArray(saved.items)?saved.items:[]).map(function(x){return String(x.recipeId);}));
    const previous=String(select.value||"");

    select.innerHTML="";
    const first=document.createElement("option");
    first.value="";
    first.textContent="-- Select Recipe --";
    select.appendChild(first);

    /* IMPORTANT: Menu of the Day only shows recipes saved under the
       selected Recipe of the Day date. Old recipes are excluded. */
    getRecipesForDate(date).slice().sort(function(a,b){
        return String(a.name||"").localeCompare(String(b.name||""));
    }).forEach(function(r){
        if(used.has(String(r.id)))return;
        const option=document.createElement("option");
        option.value=String(r.id);
        option.textContent=String(r.name||"Unnamed Recipe");
        select.appendChild(option);
    });

    if(previous && !used.has(previous)){
        const exists=Array.from(select.options).some(function(o){return String(o.value)===previous;});
        if(exists)select.value=previous;
    }
}

function selectMenuRecipe(){
    const select=document.getElementById("menuRecipeSelect");
    const entry=document.getElementById("menuRecipeEntry");
    if(!select||!entry)return;

    const id=String(select.value||"");
    if(!id){
        resetMenuEntry(false);
        return;
    }

    const r=savedRecipes.find(function(x){return String(x.id)===id;});
    if(!r){
        resetMenuEntry(false);
        return;
    }

    entry.style.display="block";
    document.getElementById("selectedMenuRecipeCost").textContent=money(r.totalCost);
    document.getElementById("menuServings").value=1;
    document.getElementById("menuSellingPrice").value=roundNumber(calculateSuggestedSellingPrice(r.totalCost,1));
    document.getElementById("menuTargetProfit").value=30;
    calculateMenuEntryForm();
}

function calculateMenuEntryForm(){
    const select=document.getElementById("menuRecipeSelect");
    if(!select)return;
    const id=String(select.value||"");
    const r=savedRecipes.find(function(x){return String(x.id)===id;});
    if(!r)return;

    const servings=Math.max(1,numberValue(document.getElementById("menuServings").value));
    let selling=numberValue(document.getElementById("menuSellingPrice").value);
    if(selling<=0){
        selling=calculateSuggestedSellingPrice(r.totalCost,servings);
        document.getElementById("menuSellingPrice").value=roundNumber(selling);
    }

    const sales=selling*servings;
    const foodCost=sales>0?(r.totalCost/sales*100):0;
    const profit=sales-r.totalCost;
    const margin=sales>0?(profit/sales*100):0;

    document.getElementById("selectedMenuRecipeCost").textContent=money(r.totalCost);
    document.getElementById("menuEntryCostServing").textContent=money(r.totalCost/servings);
    document.getElementById("menuEntrySales").textContent=money(sales);
    document.getElementById("menuEntryFoodCost").textContent=foodCost.toFixed(2)+"%";
    document.getElementById("menuEntryProfit").textContent=money(profit);
    document.getElementById("menuEntryStatus").textContent=
        "Suggested price / serving: "+money(calculateSuggestedSellingPrice(r.totalCost,servings))+
        " | Actual food cost: "+foodCost.toFixed(2)+"% | Profit margin: "+margin.toFixed(2)+"%";
}

function resetMenuEntry(hide){
    const entry=document.getElementById("menuRecipeEntry");
    const select=document.getElementById("menuRecipeSelect");
    if(entry)entry.style.display="none";
    if(select)select.value="";

    editingMenuRecipeId=null;

    const addButton=document.getElementById("addMenuItemBtn");
    if(addButton)addButton.textContent="Add Menu Item";

    const cost=document.getElementById("selectedMenuRecipeCost");
    if(cost)cost.textContent=money(0);

    const values={
        menuServings:"1",
        menuSellingPrice:"0",
        menuTargetProfit:"30",
        menuEntryCostServing:money(0),
        menuEntrySales:money(0),
        menuEntryFoodCost:"0.00%",
        menuEntryProfit:money(0),
        menuEntryStatus:""
    };
    Object.keys(values).forEach(function(id){
        const e=document.getElementById(id);
        if(!e)return;
        if(e.tagName==="INPUT")e.value=values[id];
        else e.textContent=values[id];
    });
}

function saveNewMenuItem(){
    try {
        const dateElement=document.getElementById("menuDate");
        const recipeSelect=document.getElementById("menuRecipeSelect");
        const servingsElement=document.getElementById("menuServings");
        const sellingElement=document.getElementById("menuSellingPrice");

        if(!dateElement||!recipeSelect||!servingsElement||!sellingElement){
            showMessage("menuMessage","Menu form is incomplete. Please refresh the page.","error");
            return false;
        }

        const date=dateElement.value||todayString();
        dateElement.value=date;
        const id=String(recipeSelect.value||editingMenuRecipeId||"");
        const r=savedRecipes.find(function(x){return String(x.id)===id;});

        if(!date||!r){
            showMessage("menuMessage","Please select a recipe first.","error");
            return false;
        }

        const servings=Math.max(1,numberValue(servingsElement.value));
        let selling=numberValue(sellingElement.value);
        if(selling<=0)selling=calculateSuggestedSellingPrice(r.totalCost,servings);
        if(selling<=0){
            showMessage("menuMessage","Please enter a valid selling price.","error");
            return false;
        }

        let menu=getSavedMenuForDate(date);
        if(!menu){
            menu={id:Date.now().toString(),date:date,items:[]};
            savedMenus.push(menu);
        }
        if(!Array.isArray(menu.items))menu.items=[];

        const existing=menu.items.find(function(x){return String(x.recipeId)===id;});

        if(existing && !editingMenuRecipeId){
            showMessage("menuMessage","This recipe is already in Today's Menu. Click Edit to change it.","error");
            populateMenuRecipeSelect(date);
            renderMenuItems(date);
            return false;
        }

        const menuItem={
            recipeId:String(r.id),
            recipeName:r.name,
            recipeCost:numberValue(r.totalCost),
            servings:servings,
            suggestedSellingPrice:calculateSuggestedSellingPrice(r.totalCost,servings),
            sellingPrice:selling
        };

        if(existing){
            Object.assign(existing,menuItem);
        }else{
            menu.items.push(menuItem);
        }

        saveAllData();

        /* This is the important part: render the COMPLETE saved menu list.
           Nothing is replaced or hidden when another item is added. */
        renderMenuItems(date);
        populateMenuRecipeSelect(date);
        resetMenuEntry(false);

        showMessage("menuMessage",existing?r.name+" updated in Today's Menu.":r.name+" added to Today's Menu.","success");
        return true;
    }catch(error){
        console.error("saveNewMenuItem error:",error);
        showMessage("menuMessage","Unable to save the menu item. Please check the browser console for the error.","error");
        return false;
    }
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


function renderMenuItems(date){
    const c=document.getElementById("menuItems");
    if(!c){
        console.error("Menu container #menuItems was not found.");
        return;
    }

    const menu=getSavedMenuForDate(date);
    if(!menu||!Array.isArray(menu.items)||!menu.items.length){
        c.innerHTML='<div class="menu-empty">No menu items added yet. Select a recipe above and press Add Menu Item.</div>';
        updateMenuSummary(0,0,0);
        return;
    }

    c.innerHTML="";
    let totalCost=0,totalSales=0,totalProfit=0;

    menu.items.forEach(function(item){
        const servings=Math.max(1,numberValue(item.servings));
        const selling=numberValue(item.sellingPrice);
        const suggested=calculateSuggestedSellingPrice(item.recipeCost,servings);
        const sales=selling*servings;
        const fc=sales?(numberValue(item.recipeCost)/sales*100):0;
        const profit=sales-numberValue(item.recipeCost);
        const profitPercent=sales?(profit/sales*100):0;

        totalCost+=numberValue(item.recipeCost);
        totalSales+=sales;
        totalProfit+=profit;

        const d=document.createElement("div");
        d.className="menu-item";
        d.dataset.recipeId=String(item.recipeId);
        d.innerHTML=
            '<div class="menu-top">'+
                '<div><div class="menu-name">'+escapeHtml(item.recipeName)+'</div></div>'+ 
            '</div>'+ 
            '<div class="menu-info">'+
                '<div class="menu-info-box"><div class="menu-info-label">Recipe Cost</div><div class="menu-info-value">'+money(item.recipeCost)+'</div></div>'+ 
                '<div class="menu-info-box"><div class="menu-info-label">Servings</div><div class="menu-info-value">'+servings+'</div></div>'+ 
                '<div class="menu-info-box"><div class="menu-info-label">Selling Price / Serving</div><div class="menu-info-value">'+money(selling)+'</div></div>'+ 
                '<div class="menu-info-box"><div class="menu-info-label">Suggested Price / Serving</div><div class="menu-info-value">'+money(suggested)+'</div></div>'+ 
                '<div class="menu-info-box"><div class="menu-info-label">Expected Sales</div><div class="menu-info-value">'+money(sales)+'</div></div>'+ 
                '<div class="menu-info-box"><div class="menu-info-label">Food Cost</div><div class="menu-info-value">'+fc.toFixed(2)+'%</div></div>'+ 
                '<div class="menu-info-box"><div class="menu-info-label">Expected Profit</div><div class="menu-info-value">'+money(profit)+'</div></div>'+ 
                '<div class="menu-info-box"><div class="menu-info-label">Profit Margin</div><div class="menu-info-value">'+profitPercent.toFixed(2)+'%</div></div>'+ 
            '</div>'+ 
            '<div class="menu-actions">'+
                '<button type="button" class="btn btn-primary btn-small" onclick="editMenuItem(this)">Edit</button>'+ 
                '<button type="button" class="btn btn-danger btn-small" onclick="deleteMenuItem(this)">Delete</button>'+ 
            '</div>';
        c.appendChild(d);
    });

    updateMenuSummary(totalCost,totalSales,totalProfit);
}

/* ---------------------------------------------------------
   INLINE MENU EDITING
   Edit opens INSIDE the selected saved menu row.
   No need to scroll back to the top.
--------------------------------------------------------- */
function editMenuItem(button){
    const itemElement=button.closest(".menu-item");
    const date=document.getElementById("menuDate")?.value||todayString();
    if(!itemElement)return;

    /* If another row is already being edited, cancel it first. */
    const openEdit=document.querySelector(".menu-item.menu-editing");
    if(openEdit && openEdit!==itemElement){
        cancelInlineMenuEdit(openEdit.querySelector("[data-menu-cancel]"));
    }

    const recipeId=String(itemElement.dataset.recipeId||"");
    const menu=getSavedMenuForDate(date);
    const savedItem=menu&&Array.isArray(menu.items)
        ? menu.items.find(function(x){return String(x.recipeId)===recipeId;})
        : null;
    if(!savedItem)return;

    itemElement.classList.add("menu-editing");
    itemElement.dataset.originalServings=String(numberValue(savedItem.servings)||1);
    itemElement.dataset.originalSelling=String(numberValue(savedItem.sellingPrice));

    renderInlineMenuEdit(itemElement,savedItem);
}

function renderInlineMenuEdit(itemElement,item){
    const servings=Math.max(1,numberValue(item.servings));
    const selling=numberValue(item.sellingPrice);
    const recipeCost=numberValue(item.recipeCost);
    const suggested=calculateSuggestedSellingPrice(recipeCost,servings);
    const sales=selling*servings;
    const foodCost=sales?(recipeCost/sales*100):0;
    const profit=sales-recipeCost;
    const margin=sales?(profit/sales*100):0;

    itemElement.innerHTML=
        '<div class="menu-top">'+
            '<div><div class="menu-name">'+escapeHtml(item.recipeName)+'</div></div>'+
        '</div>'+
        '<div class="menu-edit-form">'+
            '<div class="form-group">'+
                '<label>Servings</label>'+
                '<input type="number" class="menu-edit-servings" min="1" step="1" value="'+servings+'" oninput="updateInlineMenuEdit(this)">'+
            '</div>'+
            '<div class="form-group">'+
                '<label>Selling Price / Serving</label>'+
                '<input type="number" class="menu-edit-selling" min="0" step="0.01" value="'+roundNumber(selling)+'" oninput="updateInlineMenuEdit(this)">'+
            '</div>'+
        '</div>'+
        '<div class="menu-info">'+
            '<div class="menu-info-box"><div class="menu-info-label">Recipe Cost</div><div class="menu-info-value" data-edit-cost>'+money(recipeCost)+'</div></div>'+ 
            '<div class="menu-info-box"><div class="menu-info-label">Suggested Price / Serving</div><div class="menu-info-value" data-edit-suggested>'+money(suggested)+'</div></div>'+ 
            '<div class="menu-info-box"><div class="menu-info-label">Expected Sales</div><div class="menu-info-value" data-edit-sales>'+money(sales)+'</div></div>'+ 
            '<div class="menu-info-box"><div class="menu-info-label">Food Cost</div><div class="menu-info-value" data-edit-food-cost>'+foodCost.toFixed(2)+'%</div></div>'+ 
            '<div class="menu-info-box"><div class="menu-info-label">Expected Profit</div><div class="menu-info-value" data-edit-profit>'+money(profit)+'</div></div>'+ 
            '<div class="menu-info-box"><div class="menu-info-label">Profit Margin</div><div class="menu-info-value" data-edit-margin>'+margin.toFixed(2)+'%</div></div>'+ 
        '</div>'+ 
        '<div class="menu-actions">'+
            '<button type="button" class="btn btn-primary btn-small" data-menu-update onclick="updateInlineMenuItem(this)">Update</button>'+ 
            '<button type="button" class="btn btn-secondary btn-small" data-menu-cancel onclick="cancelInlineMenuEdit(this)">Cancel</button>'+ 
            '<button type="button" class="btn btn-danger btn-small" onclick="deleteMenuItem(this)">Delete</button>'+ 
        '</div>';
}

function updateInlineMenuEdit(input){
    const itemElement=input.closest(".menu-item");
    if(!itemElement)return;

    const date=document.getElementById("menuDate")?.value||todayString();
    const recipeId=String(itemElement.dataset.recipeId||"");
    const menu=getSavedMenuForDate(date);
    const item=menu&&Array.isArray(menu.items)
        ? menu.items.find(function(x){return String(x.recipeId)===recipeId;})
        : null;
    if(!item)return;

    const servings=Math.max(1,numberValue(itemElement.querySelector(".menu-edit-servings")?.value));
    const selling=numberValue(itemElement.querySelector(".menu-edit-selling")?.value);
    const recipeCost=numberValue(item.recipeCost);
    const suggested=calculateSuggestedSellingPrice(recipeCost,servings);
    const sales=selling*servings;
    const foodCost=sales?(recipeCost/sales*100):0;
    const profit=sales-recipeCost;
    const margin=sales?(profit/sales*100):0;

    const set=function(selector,value){
        const el=itemElement.querySelector(selector);
        if(el)el.textContent=value;
    };
    set("[data-edit-suggested]",money(suggested));
    set("[data-edit-sales]",money(sales));
    set("[data-edit-food-cost]",foodCost.toFixed(2)+"%");
    set("[data-edit-profit]",money(profit));
    set("[data-edit-margin]",margin.toFixed(2)+"%");
}

function updateInlineMenuItem(button){
    const itemElement=button.closest(".menu-item");
    const date=document.getElementById("menuDate")?.value||todayString();
    if(!itemElement)return;

    const recipeId=String(itemElement.dataset.recipeId||"");
    const menu=getSavedMenuForDate(date);
    const item=menu&&Array.isArray(menu.items)
        ? menu.items.find(function(x){return String(x.recipeId)===recipeId;})
        : null;
    if(!item)return;

    const servings=Math.max(1,numberValue(itemElement.querySelector(".menu-edit-servings")?.value));
    let selling=numberValue(itemElement.querySelector(".menu-edit-selling")?.value);
    if(selling<=0)selling=calculateSuggestedSellingPrice(item.recipeCost,servings);
    if(selling<=0){
        showMessage("menuMessage","Please enter a valid selling price.","error");
        return;
    }

    item.servings=servings;
    item.sellingPrice=selling;
    item.suggestedSellingPrice=calculateSuggestedSellingPrice(item.recipeCost,servings);

    saveAllData();
    renderMenuItems(date);
    populateMenuRecipeSelect(date);
    showMessage("menuMessage",item.recipeName+" updated in Today's Menu.","success");
}

function cancelInlineMenuEdit(button){
    const itemElement=button.closest(".menu-item");
    const date=document.getElementById("menuDate")?.value||todayString();
    if(!itemElement)return;

    /* Re-render from saved data, so any uncommitted typing disappears. */
    renderMenuItems(date);
}

function updateMenuSummary(totalCost,totalSales,totalProfit){
    const a=document.getElementById("menuTotalCost"),b=document.getElementById("menuTotalSales"),c=document.getElementById("menuTotalProfit"),d=document.getElementById("menuTotalMargin");
    if(a)a.textContent=money(totalCost);
    if(b)b.textContent=money(totalSales);
    if(c)c.textContent=money(totalProfit);
    if(d)d.textContent=(totalSales?(totalProfit/totalSales*100):0).toFixed(2)+"%";
}
function refreshMenuCalculations(){const date=document.getElementById("menuDate")?.value;if(date)renderMenuItems(date);calculateMenuEntryForm();}
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
                return String(r.id) === String(recipeId);
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

    const suggestedEl=item.querySelector(".menu-suggested");
    if(suggestedEl)suggestedEl.textContent=money(suggested);
    const foodCostEl=item.querySelector(".menu-food-cost");
    if(foodCostEl)foodCostEl.textContent=foodCostPercent.toFixed(2)+"%";
    const profitEl=item.querySelector(".menu-profit");
    if(profitEl)profitEl.textContent=profitPercent.toFixed(2)+"%";
    const salesEl=item.querySelector(".menu-sales");
    const profitMoneyEl=item.querySelector(".menu-profit-money");
    if(salesEl)salesEl.textContent=money(sales);
    if(profitMoneyEl)profitMoneyEl.textContent=money(sales-recipe.totalCost);
}

function saveMenuItem(button){
    /* Backward compatibility: old pages can still call this function. */
    editMenuItem(button);
}

function deleteMenuItem(button){
    const item=button.closest(".menu-item"),date=document.getElementById("menuDate").value;
    if(!item)return;
    const menu=getSavedMenuForDate(date);
    if(!menu)return;
    menu.items=menu.items.filter(x=>String(x.recipeId)!==String(item.dataset.recipeId));
    if(!menu.items.length)savedMenus=savedMenus.filter(x=>x!==menu);
    saveAllData();
    populateMenuRecipeSelect(date);
    renderMenuItems(date);
    showMessage("menuMessage","Menu item deleted.","success");
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

function loadSalesScreen(){
    loadDailySales();
}

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
            "otherSalesSelect"
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
            "otherSalesSelect"
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
   MENU ADD BUTTON SAFETY HANDLER
   Uses the existing saveNewMenuItem() function.
   Authentication code below remains unchanged.
========================================================= */

window.addEventListener("load", function() {
    const addMenuButton = document.getElementById("addMenuItemBtn");
    if (addMenuButton) {
        addMenuButton.type = "button";
        addMenuButton.addEventListener("click", function(event) {
            event.preventDefault();
            event.stopPropagation();
            saveNewMenuItem();
        });
    }

    const addSalesFoodButton = document.getElementById("addSalesFoodBtn");
    if (addSalesFoodButton) {
        addSalesFoodButton.type = "button";
        addSalesFoodButton.addEventListener("click", function(event) {
            event.preventDefault();
            event.stopPropagation();
            addSalesFoodItem();
        });
    }
});


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


/* =========================================================
   STAGE 4 — TODAY'S MENU & SALES
   Combined food sales + other item sales.
========================================================= */
function stage4TodayRecord(date){
    let record=dailySalesRecords.find(function(x){return String(x.date)===String(date);});
    if(!record){record={id:createSalesRowId(),date:date,foodItems:[],otherItems:[],foodSales:0,otherSales:0,totalSales:0,foodCost:0,otherCost:0,totalCost:0,grossProfit:0,expenses:0,profit:0,soldOutFoodIds:[]};dailySalesRecords.push(record);}
    if(!Array.isArray(record.foodItems))record.foodItems=[];
    if(!Array.isArray(record.otherItems))record.otherItems=[];
    return record;
}
function loadMenuOfDay(){
    const d=document.getElementById('menuDate'); if(!d)return;
    if(!d.value)d.value=todayString();
    populateMenuRecipeSelect(d.value);
    renderMenuItems(d.value);
    renderDailyOtherItemDropdown(d.value);
    renderDailyOtherItems(d.value);
    calculateCombinedSales(d.value);
    resetMenuEntry(false);
}
function populateMenuRecipeSelect(date){
    const select=document.getElementById('menuRecipeSelect'); if(!select)return;
    const record=stage4TodayRecord(date);
    const used=new Set(record.foodItems.map(function(x){return String(x.recipeId);}));
    select.innerHTML='<option value="">-- Select Recipe --</option>';
    getRecipesForDate(date).slice().sort(function(a,b){return String(a.name||'').localeCompare(String(b.name||''));}).forEach(function(r){
        if(used.has(String(r.id)))return;
        const o=document.createElement('option');o.value=String(r.id);o.textContent=String(r.name||'Unnamed Recipe');select.appendChild(o);
    });
}
function selectMenuRecipe(){
    const select=document.getElementById('menuRecipeSelect'),entry=document.getElementById('menuRecipeEntry');if(!select||!entry)return;
    const r=savedRecipes.find(function(x){return String(x.id)===String(select.value||'');});
    if(!r){entry.style.display='none';return;}
    entry.style.display='block';
    document.getElementById('selectedMenuRecipeCost').textContent=money(r.totalCost);
    document.getElementById('menuEntryRecipeCost').textContent=money(r.totalCost);
    document.getElementById('menuSellingPrice').value='';
    calculateMenuEntryForm();
}
function calculateMenuEntryForm(){
    const id=String(document.getElementById('menuRecipeSelect')?.value||'');
    const r=savedRecipes.find(function(x){return String(x.id)===id;});
    if(!r)return;

    const selling=numberValue(document.getElementById('menuSellingPrice').value);
    const servings=0;
    const sales=selling*servings;
    const profit=sales-numberValue(r.totalCost);
    const pct=sales?profit/sales*100:0;
    const set=function(id,v,cls){const e=document.getElementById(id);if(e){e.textContent=v;e.classList.remove('profit-positive','profit-negative');if(cls)e.classList.add(cls);}};

    set('menuEntryRecipeCost',money(r.totalCost));
    set('menuEntrySelling',money(selling));
    set('menuEntryServings','Enter on saved card');
    set('menuEntrySales',money(sales));
    set('menuEntryProfit',money(profit),profit>0?'profit-positive':profit<0?'profit-negative':'');
    set('menuEntryProfitPercent',pct.toFixed(2)+'%',pct>0?'profit-positive':pct<0?'profit-negative':'');
}

function addFoodMenuSale(){
    const date=document.getElementById('menuDate').value||todayString();
    const id=String(document.getElementById('menuRecipeSelect').value||'');
    const r=savedRecipes.find(function(x){return String(x.id)===id;});
    const selling=numberValue(document.getElementById('menuSellingPrice').value);

    if(!r||selling<=0){
        showMessage('menuMessage','Please select a recipe and enter Selling Price / Serving.','error');
        return;
    }

    const record=stage4TodayRecord(date);
    if(record.foodItems.some(function(x){return String(x.recipeId)===id;})){
        showMessage('menuMessage','This recipe is already added for today.','error');
        return;
    }

    record.foodItems.push({
        id:createSalesRowId(),
        recipeId:id,
        recipeName:r.name,
        recipeCost:numberValue(r.totalCost),
        sellingPrice:selling,
        servingsSold:0
    });

    saveAllData();
    loadMenuOfDay();
    showMessage('menuMessage',r.name+' added to today\'s menu. Enter servings sold on the saved card.','success');
}

function renderMenuItems(date){
    const c=document.getElementById('menuItems');if(!c)return;const record=stage4TodayRecord(date);c.innerHTML='';
    if(!record.foodItems.length){c.innerHTML='<div class="menu-empty">No food sales added yet.</div>';return;}
    record.foodItems.forEach(function(item){
        const sales=numberValue(item.sellingPrice)*numberValue(item.servingsSold),profit=sales-numberValue(item.recipeCost),pct=sales?profit/sales*100:0;
        const d=document.createElement('div');d.className='menu-item';d.dataset.foodId=item.id;
        d.innerHTML='<div class="menu-top"><div class="menu-name">'+escapeHtml(item.recipeName)+'</div><div class="menu-actions"><button type="button" class="btn btn-secondary btn-small" onclick="editStage4Food(this)">Edit</button><button type="button" class="btn btn-danger btn-small" onclick="deleteStage4Food(this)">Delete</button></div></div>'+
        '<div class="menu-summary-grid-6">'+stage4Box('Recipe Cost',money(item.recipeCost)) + stage4Box('Selling / Serving',money(item.sellingPrice)) + stage4Box('Servings Sold',item.servingsSold) + stage4Box('Total Sales',money(sales)) + stage4Box('Profit',money(profit),profit) + stage4Box('Profit %',pct.toFixed(2)+'%',profit)+'</div>';
        c.appendChild(d);
    });
}
function stage4Box(label,value,profit){const cls=profit>0?'profit-positive':profit<0?'profit-negative':'';return '<div class="menu-summary-box"><span>'+label+'</span><strong class="'+cls+'">'+value+'</strong></div>';}
function editStage4Food(btn){const el=btn.closest('.menu-item'),date=document.getElementById('menuDate').value,record=stage4TodayRecord(date),item=record.foodItems.find(function(x){return String(x.id)===String(el.dataset.foodId);});if(!item)return;
    el.innerHTML='<div class="menu-name">'+escapeHtml(item.recipeName)+'</div><div class="form-grid"><div class="form-group"><label>Selling Price / Serving</label><input class="stage4-edit-price" type="number" min="0" step="0.01" value="'+item.sellingPrice+'"></div><div class="form-group"><label>Servings Sold</label><input class="stage4-edit-servings" type="number" min="0" step="1" value="'+item.servingsSold+'"></div></div><div class="button-row"><button type="button" class="btn btn-primary btn-small" onclick="updateStage4Food(this)">Update</button><button type="button" class="btn btn-secondary btn-small" onclick="loadMenuOfDay()">Cancel</button></div>';
}
function updateStage4Food(btn){const el=btn.closest('.menu-item'),date=document.getElementById('menuDate').value,record=stage4TodayRecord(date),item=record.foodItems.find(function(x){return String(x.id)===String(el.dataset.foodId);});if(!item)return;const p=numberValue(el.querySelector('.stage4-edit-price').value),q=numberValue(el.querySelector('.stage4-edit-servings').value);if(p<=0||q<=0){showMessage('menuMessage','Enter valid Selling Price and Servings Sold.','error');return;}item.sellingPrice=p;item.servingsSold=q;saveAllData();loadMenuOfDay();}
function deleteStage4Food(btn){const el=btn.closest('.menu-item'),date=document.getElementById('menuDate').value,record=stage4TodayRecord(date);if(!confirm('Delete this food sale?'))return;record.foodItems=record.foodItems.filter(function(x){return String(x.id)!==String(el.dataset.foodId);});saveAllData();loadMenuOfDay();}
function renderDailyOtherItemDropdown(date){const s=document.getElementById('dailyOtherItemSelect');if(!s)return;const record=stage4TodayRecord(date),used=new Set(record.otherItems.map(function(x){return String(x.otherItemId);}));s.innerHTML='<option value="">-- Select Other Item --</option>';otherItems.slice().sort(function(a,b){return String(a.name).localeCompare(String(b.name));}).forEach(function(item){if(used.has(String(item.id)))return;const o=document.createElement('option');o.value=String(item.id);o.textContent=item.name;s.appendChild(o);});}
function addDailyOtherItemFromSelect(){const s=document.getElementById('dailyOtherItemSelect'),id=String(s.value||'');if(!id)return;const date=document.getElementById('menuDate').value||todayString(),item=otherItems.find(function(x){return String(x.id)===id;}),record=stage4TodayRecord(date);if(!item)return;if(record.otherItems.some(function(x){return String(x.otherItemId)===id;}))return;record.otherItems.push({id:createSalesRowId(),otherItemId:id,name:item.name,unitCost:numberValue(item.unitCost),sellingPrice:numberValue(item.sellingPrice),quantitySold:0});saveAllData();loadMenuOfDay();}
function renderDailyOtherItems(date){const c=document.getElementById('dailyOtherItemsList');if(!c)return;const record=stage4TodayRecord(date);c.innerHTML='';if(!record.otherItems.length){c.innerHTML='<div class="menu-empty">No other items sold.</div>';return;}record.otherItems.forEach(function(item){const sales=numberValue(item.sellingPrice)*numberValue(item.quantitySold),cost=numberValue(item.unitCost)*numberValue(item.quantitySold),profit=sales-cost,pct=sales?profit/sales*100:0;const d=document.createElement('div');d.className='menu-item';d.dataset.otherId=item.id;d.innerHTML='<div class="menu-top"><div class="menu-name">'+escapeHtml(item.name)+'</div><div class="menu-actions"><button type="button" class="btn btn-danger btn-small" onclick="deleteDailyOtherItem(this)">Delete</button></div></div><div class="daily-other-grid"><div class="form-group"><label>Unit Cost</label><input type="number" value="'+item.unitCost+'" readonly></div><div class="form-group"><label>Selling Price</label><input class="other-sale-price" type="number" min="0" step="0.01" value="'+item.sellingPrice+'" oninput="updateDailyOtherItem(this)"></div><div class="form-group"><label>Qty Sold</label><input class="other-sale-qty" type="number" min="0" step="1" value="'+item.quantitySold+'" oninput="updateDailyOtherItem(this)"></div><div class="menu-summary-box"><span>Profit</span><strong class="'+(profit>0?'profit-positive':profit<0?'profit-negative':'')+'">'+money(profit)+' ('+pct.toFixed(2)+'%)</strong></div></div><div class="small-text">Total Sales: <strong>'+money(sales)+'</strong></div>';c.appendChild(d);});}
function updateDailyOtherItem(input){const el=input.closest('.menu-item'),date=document.getElementById('menuDate').value,record=stage4TodayRecord(date),item=record.otherItems.find(function(x){return String(x.id)===String(el.dataset.otherId);});if(!item)return;item.sellingPrice=numberValue(el.querySelector('.other-sale-price').value);item.quantitySold=numberValue(el.querySelector('.other-sale-qty').value);saveAllData();renderDailyOtherItems(date);calculateCombinedSales(date);}
function deleteDailyOtherItem(btn){const el=btn.closest('.menu-item'),date=document.getElementById('menuDate').value,record=stage4TodayRecord(date);record.otherItems=record.otherItems.filter(function(x){return String(x.id)!==String(el.dataset.otherId);});saveAllData();loadMenuOfDay();}
function calculateCombinedSales(date){const record=stage4TodayRecord(date);let foodSales=0,foodCost=0,otherSales=0,otherCost=0;record.foodItems.forEach(function(x){foodSales+=numberValue(x.sellingPrice)*numberValue(x.servingsSold);foodCost+=numberValue(x.recipeCost);});record.otherItems.forEach(function(x){otherSales+=numberValue(x.sellingPrice)*numberValue(x.quantitySold);otherCost+=numberValue(x.unitCost)*numberValue(x.quantitySold);});record.foodSales=foodSales;record.otherSales=otherSales;record.totalSales=foodSales+otherSales;record.foodCost=foodCost;record.otherCost=otherCost;record.totalCost=foodCost+otherCost;record.grossProfit=record.totalSales-record.totalCost;record.profit=record.grossProfit;const set=function(id,v){const e=document.getElementById(id);if(e)e.textContent=v;};set('combinedFoodSales',money(foodSales));set('combinedOtherSales',money(otherSales));set('combinedTotalSales',money(record.totalSales));set('combinedTotalCost',money(record.totalCost));set('combinedGrossProfit',money(record.grossProfit));set('combinedProfitPercent',(record.totalSales?record.grossProfit/record.totalSales*100:0).toFixed(2)+'%');saveAllData();updateDashboard();}
function saveCombinedMenuSales(){const date=document.getElementById('menuDate').value||todayString();calculateCombinedSales(date);showMessage('menuMessage','Today\'s Menu & Sales saved successfully.','success');}

/* =========================================================
   STAGE 4 FINAL FIXES
   - Refresh Other Items from Supabase before daily sales loads.
   - Preserve input focus/cursor while editing Other Items Sold.
   - Show the master Unit on daily Other Items Sold cards.
   - Add Sold Out lock state to Food Sales cards.
   - Sold Out cards expose Edit only; Edit temporarily unlocks the card.
========================================================= */

async function loadMenuOfDay(){
    const d=document.getElementById('menuDate');
    if(!d)return;
    if(!d.value)d.value=todayString();

    /* Other Items are stored in Supabase. Refresh the master list directly
       before rendering the daily selector. */
    const userId=await getCurrentUserId();
    if(userId){
        const {data,error}=await supabaseClient
            .from('other_items')
            .select('*')
            .eq('user_id',userId)
            .order('created_at',{ascending:false});

        if(!error){
            otherItems=(data||[]).map(function(x){
                return {
                    id:String(x.id),
                    name:String(x.name||''),
                    purchasePrice:numberValue(x.purchase_price),
                    quantity:numberValue(x.quantity),
                    unit:String(x.unit||''),
                    unitCost:numberValue(x.unit_cost),
                    sellingPrice:numberValue(x.selling_price)
                };
            });
        }else{
            console.error('Unable to refresh Other Items for daily sales:',error);
        }
    }

    populateMenuRecipeSelect(d.value);
    renderMenuItems(d.value);
    renderDailyOtherItemDropdown(d.value);
    renderDailyOtherItems(d.value);
    calculateCombinedSales(d.value);
    resetMenuEntry(false);
}

function stage4IsFoodSoldOut(record,itemId){
    return !!(record && Array.isArray(record.soldOutFoodIds) &&
        record.soldOutFoodIds.map(String).indexOf(String(itemId))!==-1);
}

function setStage4FoodSoldOut(record,itemId,value){
    if(!Array.isArray(record.soldOutFoodIds))record.soldOutFoodIds=[];
    const id=String(itemId);
    record.soldOutFoodIds=record.soldOutFoodIds.map(String).filter(function(x){return x!==id;});
    if(value)record.soldOutFoodIds.push(id);
}

function renderMenuItems(date){
    const c=document.getElementById('menuItems');
    if(!c)return;
    const record=stage4TodayRecord(date);
    c.innerHTML='';

    if(!record.foodItems.length){
        c.innerHTML='<div class="menu-empty">No food menus added yet.</div>';
        return;
    }

    record.foodItems.forEach(function(item){
        const sales=numberValue(item.sellingPrice)*numberValue(item.servingsSold);
        const profit=sales-numberValue(item.recipeCost);
        const pct=sales?profit/sales*100:0;
        const soldOut=stage4IsFoodSoldOut(record,item.id);

        const d=document.createElement('div');
        d.className='menu-item'+(soldOut?' stage4-food-sold-out':'');
        d.dataset.foodId=item.id;

        const actions=soldOut
            ? '<button type="button" class="btn btn-secondary btn-small" onclick="editStage4Food(this)">Edit</button>'
            : '<button type="button" class="btn btn-danger btn-small" onclick="deleteStage4Food(this)">Delete</button>'+
              '<button type="button" class="btn btn-secondary btn-small" onclick="soldOutStage4Food(this)">Sold Out</button>'+
              '<button type="button" class="btn btn-secondary btn-small" onclick="editStage4Food(this)">Edit</button>';

        d.innerHTML=
            '<div class="menu-top">'+
                '<div><div class="menu-name">'+escapeHtml(item.recipeName)+'</div>'+(soldOut?'<div class="stage4-sold-out-label">SOLD OUT</div>':'')+'</div>'+
                '<div class="menu-actions">'+actions+'</div>'+ 
            '</div>'+
            '<div class="menu-summary-grid-6">'+
                stage4Box('Recipe Cost',money(item.recipeCost))+
                stage4Box('Selling / Serving',money(item.sellingPrice))+
                '<div class="menu-summary-box menu-serving-input-box"><span>Servings Sold</span><strong>'+numberValue(item.servingsSold)+'</strong></div>'+ 
                stage4Box('Total Sales',money(sales))+
                stage4Box('Profit',money(profit),profit)+
                stage4Box('Profit %',pct.toFixed(2)+'%',profit)+
            '</div>'+ 
            (!soldOut ?
                '<div class="stage4-add-sales-box">'+
                    '<div class="stage4-add-sales-title">Add Sold</div>'+ 
                    '<div class="stage4-add-sales-row">'+
                        '<button type="button" class="btn btn-secondary btn-small stage4-add-sales-minus" onclick="changeStage4AddSold(this,-1)" aria-label="Decrease quantity">−</button>'+ 
                        '<input class="stage4-add-sales-qty mobile-large-input" type="number" min="1" max="999" step="1" value="1" inputmode="numeric" autocomplete="off" aria-label="Number of servings to add">'+
                        '<button type="button" class="btn btn-secondary btn-small stage4-add-sales-plus" onclick="changeStage4AddSold(this,1)" aria-label="Increase quantity">+</button>'+ 
                        '<button type="button" class="btn btn-primary btn-small" onclick="addStage4Sold(this)">ADD SOLD</button>'+ 
                    '</div>'+ 
                '</div>' : '');

        c.appendChild(d);
    });
}

function soldOutStage4Food(btn){
    const el=btn.closest('.menu-item');
    const date=document.getElementById('menuDate').value||todayString();
    const record=stage4TodayRecord(date);
    if(!el)return;
    const item=record.foodItems.find(function(x){return String(x.id)===String(el.dataset.foodId);});
    if(!item)return;

    setStage4FoodSoldOut(record,item.id,true);
    saveAllData();
    loadMenuOfDay();
}

function changeStage4AddSold(btn,delta){
    const el=btn.closest('.menu-item');
    if(!el)return;
    const input=el.querySelector('.stage4-add-sales-qty');
    if(!input)return;
    const current=Math.max(1,Math.floor(numberValue(input.value)||1));
    input.value=Math.max(1,current+delta);
}

function addStage4Sold(btn){
    const el=btn.closest('.menu-item');
    if(!el)return;
    const date=document.getElementById('menuDate').value||todayString();
    const record=stage4TodayRecord(date);
    const item=record.foodItems.find(function(x){return String(x.id)===String(el.dataset.foodId);});
    if(!item)return;

    if(stage4IsFoodSoldOut(record,item.id)){
        showMessage('menuMessage','This food is marked Sold Out. Press Edit first to reactivate it.','error');
        return;
    }

    const input=el.querySelector('.stage4-add-sales-qty');
    const addQty=Math.max(1,Math.floor(numberValue(input ? input.value : 1)));
    item.servingsSold=Math.max(0,Math.floor(numberValue(item.servingsSold)))+addQty;

    saveAllData();
    loadMenuOfDay();
    showMessage('menuMessage',item.recipeName+' updated: '+item.servingsSold+' servings sold.','success');
}

function editStage4Food(btn){
    const el=btn.closest('.menu-item');
    const date=document.getElementById('menuDate').value||todayString();
    const record=stage4TodayRecord(date);
    if(!el)return;
    const item=record.foodItems.find(function(x){return String(x.id)===String(el.dataset.foodId);});
    if(!item)return;

    /* Editing a Sold Out item immediately makes the whole card active again. */
    setStage4FoodSoldOut(record,item.id,false);
    saveAllData();

    el.classList.remove('stage4-food-sold-out');
    el.innerHTML=
        '<div class="menu-top"><div><div class="menu-name">'+escapeHtml(item.recipeName)+'</div></div></div>'+ 
        '<div class="form-grid">'+
            '<div class="form-group"><label>Selling Price / Serving</label><input class="stage4-edit-price mobile-large-input" type="number" min="0" step="0.01" value="'+numberValue(item.sellingPrice)+'" inputmode="decimal" autocomplete="off"></div>'+ 
            '<div class="form-group"><label>Servings Sold</label><input class="stage4-edit-servings mobile-large-input" type="number" min="0" step="1" value="'+numberValue(item.servingsSold)+'" inputmode="numeric" autocomplete="off"></div>'+ 
        '</div>'+ 
        '<div class="button-row">'+
            '<button type="button" class="btn btn-primary btn-small" onclick="updateStage4Food(this)">Update</button>'+ 
            '<button type="button" class="btn btn-secondary btn-small" onclick="loadMenuOfDay()">Cancel</button>'+ 
        '</div>';
}

function updateStage4Food(btn){
    const el=btn.closest('.menu-item');
    const date=document.getElementById('menuDate').value||todayString();
    const record=stage4TodayRecord(date);
    if(!el)return;
    const item=record.foodItems.find(function(x){return String(x.id)===String(el.dataset.foodId);});
    if(!item)return;

    const priceInput=el.querySelector('.stage4-edit-price');
    const servingsInput=el.querySelector('.stage4-edit-servings');
    const p=numberValue(priceInput ? priceInput.value : 0);
    const q=Math.max(0,Math.floor(numberValue(servingsInput ? servingsInput.value : 0)));

    if(p<=0){
        showMessage('menuMessage','Enter a valid Selling Price / Serving.','error');
        return;
    }

    item.sellingPrice=p;
    item.servingsSold=q;

    /* Updated item remains active after Edit, even if it was previously Sold Out. */
    setStage4FoodSoldOut(record,item.id,false);
    saveAllData();
    loadMenuOfDay();
    showMessage('menuMessage',item.recipeName+' updated successfully.','success');
}

function deleteStage4Food(btn){
    const el=btn.closest('.menu-item');
    const date=document.getElementById('menuDate').value||todayString();
    const record=stage4TodayRecord(date);
    if(!el)return;
    if(!confirm('Delete this food sale?'))return;

    record.foodItems=record.foodItems.filter(function(x){
        return String(x.id)!==String(el.dataset.foodId);
    });
    setStage4FoodSoldOut(record,el.dataset.foodId,false);
    saveAllData();
    loadMenuOfDay();
}

function renderDailyOtherItemDropdown(date){
    const s=document.getElementById('dailyOtherItemSelect');
    if(!s)return;
    const record=stage4TodayRecord(date);
    const used=new Set(record.otherItems.map(function(x){return String(x.otherItemId);}));

    s.innerHTML='<option value="">-- Select Other Item --</option>';

    otherItems.slice().sort(function(a,b){
        return String(a.name||'').localeCompare(String(b.name||''));
    }).forEach(function(item){
        if(used.has(String(item.id)))return;
        const o=document.createElement('option');
        o.value=String(item.id);
        o.textContent=String(item.name||'Unnamed Item');
        s.appendChild(o);
    });
}

function addDailyOtherItemFromSelect(){
    const s=document.getElementById('dailyOtherItemSelect');
    const id=String(s?s.value||'':'');
    if(!id)return;

    const date=document.getElementById('menuDate').value||todayString();
    const item=otherItems.find(function(x){return String(x.id)===id;});
    const record=stage4TodayRecord(date);
    if(!item)return;

    if(record.otherItems.some(function(x){return String(x.otherItemId)===id;})){
        showMessage('menuMessage','This other item is already added for today.','error');
        renderDailyOtherItemDropdown(date);
        return;
    }

    record.otherItems.push({
        id:createSalesRowId(),
        otherItemId:id,
        name:item.name,
        unit:item.unit||'',
        unitCost:numberValue(item.unitCost),
        sellingPrice:numberValue(item.sellingPrice),
        quantitySold:0
    });

    saveAllData();
    loadMenuOfDay();
}

function renderDailyOtherItems(date){
    const c=document.getElementById('dailyOtherItemsList');
    if(!c)return;
    const record=stage4TodayRecord(date);
    c.innerHTML='';

    if(!record.otherItems.length){
        c.innerHTML='<div class="menu-empty">No other items sold.</div>';
        return;
    }

    record.otherItems.forEach(function(item){
        const sales=numberValue(item.sellingPrice)*numberValue(item.quantitySold);
        const cost=numberValue(item.unitCost)*numberValue(item.quantitySold);
        const profit=sales-cost;
        const pct=sales?profit/sales*100:0;
        const d=document.createElement('div');
        d.className='menu-item';
        d.dataset.otherId=item.id;

        d.innerHTML=
            '<div class="menu-top">'+
                '<div class="menu-name">'+escapeHtml(item.name)+'</div>'+ 
                '<div class="menu-actions"><button type="button" class="btn btn-danger btn-small" onclick="deleteDailyOtherItem(this)">Delete</button></div>'+ 
            '</div>'+ 
            '<div class="daily-other-grid">'+
                '<div class="form-group"><label>Unit</label><input class="other-unit" type="text" value="'+escapeHtml(item.unit||'')+'" readonly></div>'+ 
                '<div class="form-group"><label>Unit Cost</label><input class="other-unit-cost" type="number" value="'+numberValue(item.unitCost)+'" readonly></div>'+ 
                '<div class="form-group"><label>Selling Price</label><input class="other-sale-price" type="number" min="0" step="0.01" value="'+numberValue(item.sellingPrice)+'" inputmode="decimal" autocomplete="off" oninput="updateDailyOtherItem(this)"></div>'+ 
                '<div class="form-group"><label>Qty Sold</label><input class="other-sale-qty" type="number" min="0" step="1" value="'+numberValue(item.quantitySold)+'" inputmode="numeric" autocomplete="off" oninput="updateDailyOtherItem(this)"></div>'+ 
            '</div>'+ 
            '<div class="menu-summary-grid-6">'+
                stage4Box('Total Sales',money(sales))+ 
                stage4Box('Profit',money(profit),profit)+ 
                stage4Box('Profit %',pct.toFixed(2)+'%',profit)+
            '</div>';
        c.appendChild(d);
    });
}

function updateDailyOtherItem(input){
    const el=input.closest('.menu-item');
    if(!el)return;
    const date=document.getElementById('menuDate').value||todayString();
    const record=stage4TodayRecord(date);
    const item=record.otherItems.find(function(x){return String(x.id)===String(el.dataset.otherId);});
    if(!item)return;

    /* IMPORTANT: do not rebuild the card on every keystroke. Rebuilding it
       was forcing the user to drag/select the whole number before typing.
       The active input remains untouched, so normal mobile/keyboard
       navigation works freely. */
    const priceInput=el.querySelector('.other-sale-price');
    const qtyInput=el.querySelector('.other-sale-qty');
    item.sellingPrice=numberValue(priceInput.value);
    item.quantitySold=numberValue(qtyInput.value);

    const sales=item.sellingPrice*item.quantitySold;
    const cost=item.unitCost*item.quantitySold;
    const profit=sales-cost;
    const pct=sales?profit/sales*100:0;

    const boxes=el.querySelectorAll('.menu-summary-box');
    if(boxes[0])boxes[0].querySelector('strong').textContent=money(sales);
    if(boxes[1]){
        const strong=boxes[1].querySelector('strong');
        strong.textContent=money(profit);
        strong.classList.remove('profit-positive','profit-negative');
        if(profit>0)strong.classList.add('profit-positive');
        if(profit<0)strong.classList.add('profit-negative');
    }
    if(boxes[2]){
        const strong=boxes[2].querySelector('strong');
        strong.textContent=pct.toFixed(2)+'%';
        strong.classList.remove('profit-positive','profit-negative');
        if(pct>0)strong.classList.add('profit-positive');
        if(pct<0)strong.classList.add('profit-negative');
    }

    calculateCombinedSales(date);
}

function deleteDailyOtherItem(btn){
    const el=btn.closest('.menu-item');
    const date=document.getElementById('menuDate').value||todayString();
    const record=stage4TodayRecord(date);
    if(!el)return;
    if(!confirm('Delete this other item sale?'))return;

    record.otherItems=record.otherItems.filter(function(x){
        return String(x.id)!==String(el.dataset.otherId);
    });
    saveAllData();
    loadMenuOfDay();
}

/* =========================================================
   OTHER ITEMS MASTER — FINAL FIX
   Separate Dashboard > Other Items screen.

   Fixes:
   - Item Name is a working dropdown with saved items + Add New.
   - Custom item name appears when Add New is selected.
   - Unit is a working dropdown.
   - Opening Other Items refreshes the user's Supabase data.
   - Save/Edit/Delete use the current Supabase master list.
   - Duplicate item names are blocked.
   - No dependency on the old missing customOtherItemGroup element.
========================================================= */

const KK_COMMON_OTHER_ITEMS = [
    "Coca-Cola Mismo (295ml)",
    "Coca-Cola Sakto (200ml)",
    "Coca-Cola 1.5L PET",
    "Coca-Cola Zero Sugar",
    "Sprite Mismo (295ml)",
    "Sprite 1.5L PET",
    "Sprite Zero Sugar",
    "Royal Tru-Orange Mismo (295ml)",
    "Royal Tru-Orange 1.5L PET",
    "Royal Tru-Lemon",
    "Pepsi Mismo (295ml)",
    "Pepsi 1.5L PET",
    "Pepsi Zero Sugar",
    "Mountain Dew Mismo (295ml)",
    "Mountain Dew 1.5L PET",
    "RC Cola Small (250ml)",
    "RC Cola Big (1L)",
    "7UP",
    "Mug Root Beer",
    "Sarsi Root Beer",
    "Juicy Lemon",
    "Fruit Soda Orange",
    "Fruit Soda Lemon",
    "Wilkins Pure Water (500ml)",
    "Wilkins Pure Water (1L)",
    "Nature's Spring Water (500ml)",
    "C2 Green Tea (500ml)",
    "Zesto Juice Box (200ml)",
    "Chuckie Choco Drink (250ml)",
    "Yakult",
    "Cobra Energy Drink",
    "Sting Energy Drink",
    "Nestea Iced Tea",
    "Minute Maid Pulpy Orange",
    "Del Monte Pineapple Juice",
    "Vitamilk Soya",
    "Lucky Me! Pancit Canton Original",
    "Lucky Me! Pancit Canton Chilimansi",
    "Lucky Me! Pancit Canton Sweet & Spicy",
    "Lucky Me! Beef Mami",
    "Lucky Me! Chicken Mami",
    "Nissin Cup Noodles",
    "SkyFlakes",
    "Fita",
    "Hansel",
    "Rebisco Crackers",
    "Rebisco Sandwich",
    "Chippy",
    "Piattos",
    "Nova",
    "V-Cut",
    "Cheezy",
    "Cheese Ring",
    "Boy Bawang",
    "Mang Juan",
    "Moby",
    "Loaded",
    "Oishi Prawn Crackers",
    "Clover Chips",
    "Tomi",
    "Mr. Chips",
    "Choc-Nut",
    "Maxx Candy",
    "Cloud 9",
    "Stick-O",
    "Mentos",
    "Oreo",
    "555 Sardines",
    "Mega Sardines",
    "Ligo Sardines",
    "Century Tuna",
    "Argentina Corned Beef",
    "Purefoods Corned Beef",
    "Maling",
    "Spam",
    "San Marino Corned Tuna",
    "Hunt's Pork & Beans",
    "Jolly Mushrooms",
    "Del Monte Pineapple Chunks",
    "Silver Swan Soy Sauce",
    "Datu Puti Soy Sauce",
    "Datu Puti Vinegar",
    "Silver Swan Vinegar",
    "UFC Banana Ketchup",
    "Lady's Choice Mayonnaise",
    "Kraft Cheese",
    "Bear Brand Milk",
    "Alaska Milk",
    "Milo Sachet",
    "Nescafe Coffee Sachet",
    "Kopiko Coffee Sachet",
    "Great Taste Coffee Sachet",
    "Energen",
    "Safeguard Soap",
    "Palmolive Shampoo Sachet",
    "Tide Sachet",
    "Surf Sachet",
    "Downy Sachet",
    "Joy Dishwashing Liquid Sachet",
    "LPG / Cooking Gas"
];

const KK_OTHER_ITEM_UNITS = [
    "piece",
    "bottle",
    "can",
    "pack",
    "box",
    "sachet",
    "tray",
    "cup",
    "dozen",
    "kg",
    "g",
    "liter",
    "ml"
];

function setupOtherItemForm(keepName) {
    const nameField = document.getElementById("otherItemName");
    const unitField = document.getElementById("otherUnit");

    if (!nameField || !unitField) return;

    /* Convert the old Item Name text input into a real dropdown once. */
    if (nameField.tagName !== "SELECT") {
        const select = document.createElement("select");
        select.id = "otherItemName";
        select.setAttribute("aria-label", "Item Name");
        select.addEventListener("change", handleCustomOtherItem);
        nameField.parentNode.replaceChild(select, nameField);
    }

    /* Convert Unit text input into a real dropdown once. */
    const currentUnit = unitField.value || "";
    if (unitField.tagName !== "SELECT") {
        const selectUnit = document.createElement("select");
        selectUnit.id = "otherUnit";
        selectUnit.setAttribute("aria-label", "Unit");
        unitField.parentNode.replaceChild(selectUnit, unitField);
    }

    populateOtherItemNameDropdown(keepName);
    populateOtherItemUnitDropdown(currentUnit);
    ensureCustomOtherItemField();
    handleCustomOtherItem();
}

function populateOtherItemNameDropdown(keepName) {
    const select = document.getElementById("otherItemName");
    if (!select || select.tagName !== "SELECT") return;

    const wanted = keepName !== undefined && keepName !== null
        ? String(keepName)
        : String(select.value || "");

    const items = Array.isArray(otherItems) ? otherItems.slice() : [];

    select.innerHTML = "";

    const first = document.createElement("option");
    first.value = "";
    first.textContent = "-- Select Other Item --";
    select.appendChild(first);

    const savedNames = new Set(items.map(function(item) {
        return String(item.name || "").trim().toLowerCase();
    }));

    const commonGroup = document.createElement("optgroup");
    commonGroup.label = "Common Philippine Karinderya / Store Items";
    KK_COMMON_OTHER_ITEMS.slice().sort(function(a, b) {
        return a.localeCompare(b);
    }).forEach(function(name) {
        if (savedNames.has(name.trim().toLowerCase())) return;
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        commonGroup.appendChild(option);
    });
    select.appendChild(commonGroup);

    const savedGroup = document.createElement("optgroup");
    savedGroup.label = "My Saved Items";
    items.sort(function(a, b) {
        return String(a.name || "").localeCompare(String(b.name || ""));
    }).forEach(function(item) {
        const option = document.createElement("option");
        option.value = String(item.name || "");
        option.textContent = String(item.name || "Unnamed Item");
        savedGroup.appendChild(option);
    });
    if (items.length) select.appendChild(savedGroup);

    const custom = document.createElement("option");
    custom.value = "__custom__";
    custom.textContent = "➕ Add New Other Item";
    select.appendChild(custom);

    if (wanted) {
        select.value = wanted;
    }

    if (select.value !== wanted && wanted === "__custom__") {
        select.value = "__custom__";
    }
}

function populateOtherItemUnitDropdown(keepUnit) {
    const select = document.getElementById("otherUnit");
    if (!select || select.tagName !== "SELECT") return;

    const wanted = keepUnit !== undefined && keepUnit !== null
        ? String(keepUnit)
        : String(select.value || "");

    select.innerHTML = "";

    const first = document.createElement("option");
    first.value = "";
    first.textContent = "-- Select Unit --";
    select.appendChild(first);

    KK_OTHER_ITEM_UNITS.forEach(function(unit) {
        const option = document.createElement("option");
        option.value = unit;
        option.textContent = unit;
        select.appendChild(option);
    });

    const other = document.createElement("option");
    other.value = "other";
    other.textContent = "Other / Custom Unit";
    select.appendChild(other);

    if (wanted) {
        const exists = Array.from(select.options).some(function(o) {
            return String(o.value) === wanted;
        });

        if (exists) {
            select.value = wanted;
        } else {
            const customUnit = document.createElement("option");
            customUnit.value = wanted;
            customUnit.textContent = wanted;
            select.appendChild(customUnit);
            select.value = wanted;
        }
    }
}

function ensureCustomOtherItemField() {
    const nameSelect = document.getElementById("otherItemName");
    if (!nameSelect) return;

    let group = document.getElementById("customOtherItemGroup");

    if (!group) {
        group = document.createElement("div");
        group.id = "customOtherItemGroup";
        group.style.display = "none";
        group.innerHTML =
            '<div class="form-group">' +
                '<label>New Item Name</label>' +
                '<input type="text" id="customOtherItemName" placeholder="Example: Sprite">' +
            '</div>';
        nameSelect.closest(".form-group").insertAdjacentElement("afterend", group);
    }
}

function handleCustomOtherItem() {
    const select = document.getElementById("otherItemName");
    const group = document.getElementById("customOtherItemGroup");

    if (!select || !group) return;

    if (select.value === "__custom__") {
        group.style.display = "block";
        const custom = document.getElementById("customOtherItemName");
        if (custom) custom.focus();
    } else {
        group.style.display = "none";
    }
}

async function refreshOtherItemsFromSupabase() {
    const userId = await getCurrentUserId();
    if (!userId) return false;

    const { data, error } = await supabaseClient
        .from("other_items")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Unable to refresh Other Items:", error);
        const list = document.getElementById("otherItemList");
        if (list) {
            list.innerHTML = '<div class="empty">Unable to load saved other items.</div>';
        }
        return false;
    }

    otherItems = (data || []).map(function(x) {
        return {
            id: String(x.id),
            name: String(x.name || ""),
            purchasePrice: numberValue(x.purchase_price),
            quantity: numberValue(x.quantity),
            unit: String(x.unit || ""),
            unitCost: numberValue(x.unit_cost),
            sellingPrice: numberValue(x.selling_price)
        };
    });

    return true;
}

async function renderOtherItemList() {
    const container = document.getElementById("otherItemList");
    if (!container) return;

    const requestId = ++otherItemRenderRequest;
    const loaded = await refreshOtherItemsFromSupabase();
    if (!loaded || requestId !== otherItemRenderRequest) return;

    container.innerHTML = "";

    if (!otherItems.length) {
        container.innerHTML = '<div class="empty">No other items saved yet.</div>';
    } else {
        otherItems.forEach(function(item) {
            const div = document.createElement("div");
            div.className = "saved-row";
            div.innerHTML =
                '<div class="saved-row-main">' +
                    '<strong>' + escapeHtml(item.name) + '</strong>' +
                    '<span>Purchase ' + money(item.purchasePrice) +
                    ' | Qty ' + numberValue(item.quantity) + ' ' + escapeHtml(item.unit) +
                    ' | Unit Cost ' + money(item.unitCost) +
                    ' | Sell ' + money(item.sellingPrice) + '</span>' +
                '</div>' +
                '<div class="saved-row-actions">' +
                    '<button type="button" class="btn btn-secondary btn-small" onclick="editOtherItem(\'' + item.id + '\')">Edit</button>' +
                    '<button type="button" class="btn btn-danger btn-small" onclick="deleteOtherItem(\'' + item.id + '\')">Delete</button>' +
                '</div>';
            container.appendChild(div);
        });
    }

    setupOtherItemForm();
}

async function saveOtherItem(editId) {
    setupOtherItemForm();

    const nameSelect = document.getElementById("otherItemName");
    const customName = document.getElementById("customOtherItemName");
    const purchaseInput = document.getElementById("otherPurchasePrice");
    const quantityInput = document.getElementById("otherQuantity");
    const unitSelect = document.getElementById("otherUnit");
    const sellingInput = document.getElementById("otherSellingPrice");

    if (!nameSelect || !purchaseInput || !quantityInput || !unitSelect || !sellingInput) {
        showMessage("otherItemMessage", "Other Item form is incomplete. Please refresh the page.", "error");
        return;
    }

    let name = String(nameSelect.value || "").trim();

    if (name === "__custom__") {
        name = customName ? customName.value.trim() : "";
    }

    let unit = String(unitSelect.value || "").trim();

    if (unit === "other") {
        const customUnit = window.prompt("Enter the unit name, for example: jar, sachet, bundle", "");
        if (customUnit === null) return;
        unit = customUnit.trim();
    }

    const purchasePrice = numberValue(purchaseInput.value);
    const quantity = numberValue(quantityInput.value);
    const sellingPrice = numberValue(sellingInput.value);

    if (!name || purchasePrice <= 0 || quantity <= 0 || !unit || sellingPrice <= 0) {
        showMessage("otherItemMessage", "Please enter Item Name, Purchase Price, Quantity, Unit and Selling Price.", "error");
        return;
    }

    const duplicate = otherItems.find(function(item) {
        return String(item.name || "").trim().toLowerCase() === name.toLowerCase() &&
               String(item.id) !== String(editId || "");
    });

    if (duplicate) {
        showMessage("otherItemMessage", "This item is already saved. Edit the existing item instead.", "error");
        return;
    }

    const userId = await getCurrentUserId();
    if (!userId) {
        showMessage("otherItemMessage", "Please log in again before saving an Other Item.", "error");
        return;
    }

    const unitCost = purchasePrice / quantity;
    let error = null;

    if (editId) {
        const result = await supabaseClient
            .from("other_items")
            .update({
                name: name,
                purchase_price: purchasePrice,
                quantity: quantity,
                unit: unit,
                unit_cost: unitCost,
                selling_price: sellingPrice
            })
            .eq("id", Number(editId))
            .eq("user_id", userId);
        error = result.error;
    } else {
        const result = await supabaseClient
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
        error = result.error;
    }

    if (error) {
        console.error("Unable to save Other Item:", error);
        showMessage("otherItemMessage", "Unable to save other item. Please check the Supabase error in the browser console.", "error");
        return;
    }

    await renderOtherItemList();
    clearOtherItemForm();

    showMessage(
        "otherItemMessage",
        editId ? "Other item updated successfully." : "Other item saved successfully.",
        "success"
    );
}

function clearOtherItemForm() {
    const purchase = document.getElementById("otherPurchasePrice");
    const quantity = document.getElementById("otherQuantity");
    const selling = document.getElementById("otherSellingPrice");
    const customName = document.getElementById("customOtherItemName");

    if (purchase) purchase.value = "";
    if (quantity) quantity.value = "";
    if (selling) selling.value = "";
    if (customName) customName.value = "";

    setupOtherItemForm("");

    const unit = document.getElementById("otherUnit");
    if (unit) unit.value = "";

    const button = document.querySelector('#otherItemScreen button[onclick^="saveOtherItem"]');
    if (button) {
        button.textContent = "Save Other Item";
        button.onclick = function() { saveOtherItem(); };
    }

    handleCustomOtherItem();
}

function editOtherItem(id) {
    const item = otherItems.find(function(x) {
        return String(x.id) === String(id);
    });
    if (!item) return;

    showScreen("otherItemScreen");

    setupOtherItemForm(item.name);

    const nameSelect = document.getElementById("otherItemName");
    if (nameSelect) nameSelect.value = item.name;

    const purchase = document.getElementById("otherPurchasePrice");
    const quantity = document.getElementById("otherQuantity");
    const unit = document.getElementById("otherUnit");
    const selling = document.getElementById("otherSellingPrice");

    if (purchase) purchase.value = numberValue(item.purchasePrice);
    if (quantity) quantity.value = numberValue(item.quantity);
    if (unit) {
        populateOtherItemUnitDropdown(item.unit);
        unit.value = item.unit;
    }
    if (selling) selling.value = numberValue(item.sellingPrice);

    const button = document.querySelector('#otherItemScreen button[onclick^="saveOtherItem"]');
    if (button) {
        button.textContent = "Update Other Item";
        button.onclick = function() { saveOtherItem(id); };
    }

    handleCustomOtherItem();
    window.scrollTo(0, 0);
}

async function deleteOtherItem(id) {
    if (!confirm("Delete this other item?")) return;

    const userId = await getCurrentUserId();
    if (!userId) return;

    const { error } = await supabaseClient
        .from("other_items")
        .delete()
        .eq("id", Number(id))
        .eq("user_id", userId);

    if (error) {
        console.error("Unable to delete Other Item:", error);
        showMessage("otherItemMessage", "Unable to delete other item.", "error");
        return;
    }

    await renderOtherItemList();
    clearOtherItemForm();
}

/* Override screen navigation only to refresh the separate Other Items master screen. */
const kkOriginalShowScreen = showScreen;
showScreen = function(screenId) {
    kkOriginalShowScreen(screenId);

    if (screenId === "otherItemScreen") {
        setupOtherItemForm();
        renderOtherItemList();
    }
};

/* Make sure the replacement controls are ready when the page is loaded. */
document.addEventListener("DOMContentLoaded", function() {
    if (document.getElementById("otherItemScreen")) {
        setupOtherItemForm();
    }
});

/* =========================================================
   CUMULATIVE ADD-SOLD UI REFINEMENT
   - Remove +/- controls.
   - Put Add Sold input + button on one row.
   - Apply the same cumulative counter behavior to Other Items Sold.
========================================================= */
(function(){
    const style=document.createElement('style');
    style.id='kk-cumulative-add-sold-style';
    style.textContent=''
      +'.kk-add-sold-inline{display:flex;align-items:end;gap:8px;flex-wrap:nowrap;margin-top:10px;} '
      +'.kk-sold-total-box{flex:1;min-width:0;border:1px solid rgba(255,255,255,.16);border-radius:10px;padding:10px 12px;background:rgba(255,255,255,.04);} '
      +'.kk-sold-total-box span{display:block;font-size:13px;margin-bottom:4px;opacity:.85;} '
      +'.kk-sold-total-box strong{font-size:22px;} '
      +'.kk-add-sold-control{flex:1;min-width:0;} '
      +'.kk-add-sold-control label{display:block;font-size:13px;margin-bottom:5px;} '
      +'.kk-add-sold-control-row{display:flex;gap:6px;align-items:center;} '
      +'.kk-add-sold-control-row input{flex:1;min-width:0;} '
      +'.kk-add-sold-control-row button{white-space:nowrap;} '
      +'@media(max-width:520px){.kk-add-sold-inline{gap:6px}.kk-sold-total-box,.kk-add-sold-control{padding:8px}.kk-add-sold-control-row button{padding-left:10px;padding-right:10px}.kk-sold-total-box strong{font-size:20px;}}';
    document.head.appendChild(style);

    window.renderMenuItems=function(date){
        const c=document.getElementById('menuItems');
        if(!c)return;
        const record=stage4TodayRecord(date);
        c.innerHTML='';
        if(!record.foodItems.length){
            c.innerHTML='<div class="menu-empty">No food menus added yet.</div>';
            return;
        }
        record.foodItems.forEach(function(item){
            const sales=numberValue(item.sellingPrice)*numberValue(item.servingsSold);
            const profit=sales-numberValue(item.recipeCost);
            const pct=sales?profit/sales*100:0;
            const soldOut=stage4IsFoodSoldOut(record,item.id);
            const d=document.createElement('div');
            d.className='menu-item'+(soldOut?' stage4-food-sold-out':'');
            d.dataset.foodId=item.id;

            const actions=soldOut
                ? '<button type="button" class="btn btn-secondary btn-small" onclick="editStage4Food(this)">Edit</button>'
                : '<button type="button" class="btn btn-danger btn-small" onclick="deleteStage4Food(this)">Delete</button>'
                 +'<button type="button" class="btn btn-secondary btn-small" onclick="soldOutStage4Food(this)">Sold Out</button>'
                 +'<button type="button" class="btn btn-secondary btn-small" onclick="editStage4Food(this)">Edit</button>';

            let addSold='';
            if(!soldOut){
                addSold='<div class="kk-add-sold-inline">'
                    +'<div class="kk-sold-total-box"><span>Servings Sold</span><strong>'+numberValue(item.servingsSold)+'</strong></div>'
                    +'<div class="kk-add-sold-control"><label>Add Sold</label><div class="kk-add-sold-control-row">'
                    +'<input class="stage4-add-sales-qty mobile-large-input" type="number" min="1" max="999" step="1" value="1" inputmode="numeric" autocomplete="off" aria-label="Number of servings to add">'
                    +'<button type="button" class="btn btn-primary btn-small" onclick="addStage4Sold(this)">ADD SOLD</button>'
                    +'</div></div>'
                    +'</div>';
            }else{
                addSold='<div class="kk-add-sold-inline">'
                    +'<div class="kk-sold-total-box" style="flex:1 1 100%"><span>Servings Sold</span><strong>'+numberValue(item.servingsSold)+'</strong></div>'
                    +'</div>';
            }

            d.innerHTML='<div class="menu-top"><div><div class="menu-name">'+escapeHtml(item.recipeName)+'</div>'+(soldOut?'<div class="stage4-sold-out-label">SOLD OUT</div>':'')+'</div>'
                +'<div class="menu-actions">'+actions+'</div></div>'
                +'<div class="menu-summary-grid-6">'
                +stage4Box('Recipe Cost',money(item.recipeCost))
                +stage4Box('Selling / Serving',money(item.sellingPrice))
                +stage4Box('Total Sales',money(sales))
                +stage4Box('Profit',money(profit),profit)
                +stage4Box('Profit %',pct.toFixed(2)+'%',profit)
                +'</div>'
                +addSold;
            c.appendChild(d);
        });
    };

    window.renderDailyOtherItems=function(date){
        const c=document.getElementById('dailyOtherItemsList');
        if(!c)return;
        const record=stage4TodayRecord(date);
        c.innerHTML='';
        if(!record.otherItems.length){
            c.innerHTML='<div class="menu-empty">No other items sold.</div>';
            return;
        }
        record.otherItems.forEach(function(item){
            const sales=numberValue(item.sellingPrice)*numberValue(item.quantitySold);
            const cost=numberValue(item.unitCost)*numberValue(item.quantitySold);
            const profit=sales-cost;
            const pct=sales?profit/sales*100:0;
            const d=document.createElement('div');
            d.className='menu-item';
            d.dataset.otherId=item.id;
            d.innerHTML='<div class="menu-top">'
                +'<div class="menu-name">'+escapeHtml(item.name)+'</div>'
                +'<div class="menu-actions"><button type="button" class="btn btn-danger btn-small" onclick="deleteDailyOtherItem(this)">Delete</button></div>'
                +'</div>'
                +'<div class="daily-other-grid">'
                +'<div class="form-group"><label>Unit</label><input class="other-unit" type="text" value="'+escapeHtml(item.unit||'')+'" readonly></div>'
                +'<div class="form-group"><label>Unit Cost</label><input class="other-unit-cost" type="number" value="'+numberValue(item.unitCost)+'" readonly></div>'
                +'<div class="form-group"><label>Selling Price</label><input class="other-sale-price" type="number" min="0" step="0.01" value="'+numberValue(item.sellingPrice)+'" inputmode="decimal" autocomplete="off" oninput="updateDailyOtherItem(this)"></div>'
                +'</div>'
                +'<div class="kk-add-sold-inline">'
                +'<div class="kk-sold-total-box"><span>Qty Sold</span><strong>'+numberValue(item.quantitySold)+'</strong></div>'
                +'<div class="kk-add-sold-control"><label>Add Sold</label><div class="kk-add-sold-control-row">'
                +'<input class="other-add-sold-qty mobile-large-input" type="number" min="1" max="999" step="1" value="1" inputmode="numeric" autocomplete="off" aria-label="Number of other items sold to add">'
                +'<button type="button" class="btn btn-primary btn-small" onclick="addDailyOtherSold(this)">ADD SOLD</button>'
                +'</div></div>'
                +'</div>'
                +'<div class="menu-summary-grid-6">'
                +stage4Box('Total Sales',money(sales))
                +stage4Box('Profit',money(profit),profit)
                +stage4Box('Profit %',pct.toFixed(2)+'%',profit)
                +'</div>';
            c.appendChild(d);
        });
    };

    window.addDailyOtherSold=function(btn){
        const el=btn.closest('.menu-item');
        if(!el)return;
        const date=document.getElementById('menuDate').value||todayString();
        const record=stage4TodayRecord(date);
        const item=record.otherItems.find(function(x){return String(x.id)===String(el.dataset.otherId);});
        if(!item)return;
        const input=el.querySelector('.other-add-sold-qty');
        const addQty=Math.max(1,Math.floor(numberValue(input?input.value:1)));
        item.quantitySold=Math.max(0,Math.floor(numberValue(item.quantitySold)))+addQty;
        saveAllData();
        renderDailyOtherItems(date);
        calculateCombinedSales(date);
        showMessage('menuMessage',item.name+' updated: '+item.quantitySold+' sold.','success');
    };
})();


/* =========================================================
   CUMULATIVE ADD-SOLD MOBILE REFINEMENT V3
   - Compact 3-digit quantity box (000-999)
   - No browser + / - spinner controls
   - Total Sold, Add Sold box, and ADD SOLD stay on one row
   - Applies to Food Sales and Other Items Sold
========================================================= */
(function(){
    const style=document.createElement('style');
    style.id='kk-cumulative-add-sold-style-v3';
    style.textContent=''
      +'.kk-add-sold-inline{display:grid !important;grid-template-columns:minmax(78px,0.9fr) minmax(76px,0.8fr) auto;align-items:end;gap:7px;width:100%;margin-top:10px;} '
      +'.kk-sold-total-box{box-sizing:border-box;min-width:0 !important;width:100%;padding:8px 9px !important;border-radius:8px;} '
      +'.kk-sold-total-box span,.kk-add-sold-control label{font-size:12px !important;line-height:1.1;} '
      +'.kk-sold-total-box strong{font-size:20px !important;line-height:1.1;} '
      +'.kk-add-sold-control{min-width:0 !important;width:100%;} '
      +'.kk-add-sold-control-row{display:flex !important;gap:5px !important;align-items:center !important;} '
      +'.kk-add-sold-control-row input.stage4-add-sales-qty,.kk-add-sold-control-row input.other-add-sold-qty{width:72px !important;min-width:72px !important;max-width:72px !important;box-sizing:border-box;text-align:center;padding-left:6px !important;padding-right:6px !important;} '
      +'.kk-add-sold-control-row input[type=number]::-webkit-inner-spin-button,.kk-add-sold-control-row input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0;} '
      +'.kk-add-sold-control-row input[type=number]{-moz-appearance:textfield;appearance:textfield;} '
      +'.kk-add-sold-control-row button{white-space:nowrap !important;padding-left:9px !important;padding-right:9px !important;} '
      +'.kk-add-sold-inline[style*="flex:1 1 100%"]{display:block !important;} '
      +'@media(max-width:520px){.kk-add-sold-inline{grid-template-columns:minmax(72px,0.9fr) 72px auto;gap:5px;}.kk-sold-total-box{padding:7px 8px !important;}.kk-sold-total-box strong{font-size:19px !important;}.kk-add-sold-control label{font-size:11px !important;margin-bottom:3px !important;}.kk-add-sold-control-row input.stage4-add-sales-qty,.kk-add-sold-control-row input.other-add-sold-qty{width:68px !important;min-width:68px !important;max-width:68px !important;height:42px;}.kk-add-sold-control-row button{height:42px;font-size:12px;padding-left:8px !important;padding-right:8px !important;}.kk-add-sold-inline{margin-top:8px;}}';
    document.head.appendChild(style);

    function clampAddSoldInput(input){
        if(!input)return;
        let v=String(input.value||'').replace(/\D/g,'').slice(0,3);
        if(v==='')return;
        let n=parseInt(v,10);
        if(!Number.isFinite(n)||n<1)n=1;
        if(n>999)n=999;
        input.value=String(n);
    }

    document.addEventListener('input',function(e){
        if(e.target && (e.target.classList.contains('stage4-add-sales-qty') || e.target.classList.contains('other-add-sold-qty'))){
            clampAddSoldInput(e.target);
        }
    });
})();

/* =========================================================
   CUMULATIVE ADD-SOLD PROFESSIONAL MOBILE CARD V4
   - Professional, mobile-safe card layout
   - Action buttons are BELOW the values
   - Delete / Sold Out / Edit share one row
   - Sold Out card shows Edit only
   - Prevent horizontal overflow
========================================================= */
(function(){
    const style=document.createElement('style');
    style.id='kk-professional-mobile-card-v4';
    style.textContent=''
      +'.menu-item{box-sizing:border-box;width:100%;max-width:100%;overflow:hidden;border-radius:14px;padding:14px;margin:0 0 14px;} '
      +'.menu-item *{box-sizing:border-box;max-width:100%;} '
      +'.menu-top{display:block !important;width:100%;} '
      +'.menu-top>.menu-actions{display:none !important;} '
      +'.kk-prof-card-title{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;width:100%;margin-bottom:10px;} '
      +'.kk-prof-card-title .menu-name{min-width:0;overflow-wrap:anywhere;font-size:18px;font-weight:700;line-height:1.25;} '
      +'.kk-prof-values{display:grid !important;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;width:100%;} '
      +'.kk-prof-values .menu-summary-box{min-width:0 !important;width:100%;padding:9px 8px !important;border-radius:9px;overflow:hidden;} '
      +'.kk-prof-values .menu-summary-box span{font-size:11px !important;line-height:1.2;white-space:normal;} '
      +'.kk-prof-values .menu-summary-box strong{display:block;font-size:16px !important;line-height:1.25;overflow-wrap:anywhere;} '
      +'.kk-prof-sales-row{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:7px;width:100%;margin-top:8px;} '
      +'.kk-prof-sales-row .kk-sold-total-box,.kk-prof-sales-row .kk-add-sold-control{min-width:0;width:100%;} '
      +'.kk-prof-sales-row .kk-sold-total-box{padding:9px 10px !important;border-radius:9px;} '
      +'.kk-prof-sales-row .kk-sold-total-box span,.kk-prof-sales-row .kk-add-sold-control label{font-size:11px !important;} '
      +'.kk-prof-sales-row .kk-sold-total-box strong{font-size:20px !important;} '
      +'.kk-prof-sales-row .kk-add-sold-control-row{display:grid !important;grid-template-columns:70px minmax(0,1fr);gap:5px !important;width:100%;} '
      +'.kk-prof-sales-row input.stage4-add-sales-qty,.kk-prof-sales-row input.other-add-sold-qty{width:100% !important;min-width:0 !important;max-width:none !important;height:40px;text-align:center;} '
      +'.kk-prof-sales-row button{width:100%;height:40px;white-space:nowrap;font-size:11px;padding-left:5px !important;padding-right:5px !important;} '
      +'.kk-prof-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px;width:100%;margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,.10);} '
      +'.kk-prof-actions button{width:100%;min-width:0 !important;height:40px;padding:6px 4px !important;font-size:12px !important;white-space:nowrap;} '
      +'.kk-prof-actions.kk-one-action{grid-template-columns:1fr;} '
      +'.kk-prof-sold-label{display:inline-block;margin-top:4px;font-size:11px;font-weight:700;letter-spacing:.04em;} '
      +'.kk-prof-other-fields{display:grid !important;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;width:100%;} '
      +'.kk-prof-other-fields .form-group{min-width:0 !important;width:100%;} '
      +'.kk-prof-other-fields input{width:100% !important;min-width:0 !important;} '
      +'.kk-prof-other-actions{display:grid;grid-template-columns:1fr;width:100%;margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,.10);} '
      +'.kk-prof-other-actions button{width:100%;height:40px;} '
      +'@media(max-width:520px){.menu-item{padding:12px;margin-bottom:12px;}.kk-prof-card-title .menu-name{font-size:17px;}.kk-prof-values{gap:6px !important;}.kk-prof-values .menu-summary-box{padding:8px 7px !important;}.kk-prof-values .menu-summary-box strong{font-size:15px !important;}.kk-prof-sales-row{gap:6px;margin-top:7px;}.kk-prof-sales-row .kk-sold-total-box{padding:8px !important;}.kk-prof-sales-row .kk-sold-total-box strong{font-size:19px !important;}.kk-prof-sales-row .kk-add-sold-control-row{grid-template-columns:64px minmax(0,1fr);}.kk-prof-sales-row button{font-size:10px !important;}.kk-prof-actions{gap:6px;margin-top:9px;padding-top:9px;}.kk-prof-actions button{height:38px;font-size:11px !important;}.kk-prof-other-fields{gap:6px !important;}}';
    document.head.appendChild(style);

    window.renderMenuItems=function(date){
        const c=document.getElementById('menuItems');
        if(!c)return;
        const record=stage4TodayRecord(date);
        c.innerHTML='';
        if(!record.foodItems.length){c.innerHTML='<div class="menu-empty">No food menus added yet.</div>';return;}
        record.foodItems.forEach(function(item){
            const sales=numberValue(item.sellingPrice)*numberValue(item.servingsSold);
            const profit=sales-numberValue(item.recipeCost);
            const pct=sales?profit/sales*100:0;
            const soldOut=stage4IsFoodSoldOut(record,item.id);
            const d=document.createElement('div');
            d.className='menu-item'+(soldOut?' stage4-food-sold-out':'');
            d.dataset.foodId=item.id;

            const addSold=soldOut
              ? '<div class="kk-prof-sales-row"><div class="kk-sold-total-box" style="grid-column:1 / -1"><span>Servings Sold</span><strong>'+numberValue(item.servingsSold)+'</strong></div></div>'
              : '<div class="kk-prof-sales-row">'
                +'<div class="kk-sold-total-box"><span>Servings Sold</span><strong>'+numberValue(item.servingsSold)+'</strong></div>'
                +'<div class="kk-add-sold-control"><label>Add Sold</label><div class="kk-add-sold-control-row">'
                +'<input class="stage4-add-sales-qty mobile-large-input" type="number" min="1" max="999" step="1" value="1" inputmode="numeric" autocomplete="off" aria-label="Number of servings to add">'
                +'<button type="button" class="btn btn-primary btn-small" onclick="addStage4Sold(this)">ADD SOLD</button>'
                +'</div></div></div>';

            const actions=soldOut
              ? '<div class="kk-prof-actions kk-one-action"><button type="button" class="btn btn-secondary btn-small" onclick="editStage4Food(this)">Edit</button></div>'
              : '<div class="kk-prof-actions">'
                +'<button type="button" class="btn btn-danger btn-small" onclick="deleteStage4Food(this)">Delete</button>'
                +'<button type="button" class="btn btn-secondary btn-small" onclick="soldOutStage4Food(this)">Sold Out</button>'
                +'<button type="button" class="btn btn-secondary btn-small" onclick="editStage4Food(this)">Edit</button>'
                +'</div>';

            d.innerHTML='<div class="kk-prof-card-title">'
                +'<div><div class="menu-name">'+escapeHtml(item.recipeName)+'</div>'+(soldOut?'<div class="stage4-sold-out-label kk-prof-sold-label">SOLD OUT</div>':'')+'</div>'
                +'</div>'
                +'<div class="kk-prof-values">'
                +stage4Box('Recipe Cost',money(item.recipeCost))
                +stage4Box('Selling / Serving',money(item.sellingPrice))
                +stage4Box('Total Sales',money(sales))
                +stage4Box('Profit',money(profit),profit)
                +stage4Box('Profit %',pct.toFixed(2)+'%',profit)
                +'</div>'
                +addSold
                +actions;
            c.appendChild(d);
        });
    };

    window.renderDailyOtherItems=function(date){
        const c=document.getElementById('dailyOtherItemsList');
        if(!c)return;
        const record=stage4TodayRecord(date);
        c.innerHTML='';
        if(!record.otherItems.length){c.innerHTML='<div class="menu-empty">No other items sold.</div>';return;}
        record.otherItems.forEach(function(item){
            const sales=numberValue(item.sellingPrice)*numberValue(item.quantitySold);
            const cost=numberValue(item.unitCost)*numberValue(item.quantitySold);
            const profit=sales-cost;
            const pct=sales?profit/sales*100:0;
            const d=document.createElement('div');
            d.className='menu-item';
            d.dataset.otherId=item.id;
            d.innerHTML='<div class="kk-prof-card-title"><div class="menu-name">'+escapeHtml(item.name)+'</div></div>'
                +'<div class="kk-prof-other-fields">'
                +'<div class="form-group"><label>Unit</label><input class="other-unit" type="text" value="'+escapeHtml(item.unit||'')+'" readonly></div>'
                +'<div class="form-group"><label>Unit Cost</label><input class="other-unit-cost" type="number" value="'+numberValue(item.unitCost)+'" readonly></div>'
                +'<div class="form-group"><label>Selling Price</label><input class="other-sale-price" type="number" min="0" step="0.01" value="'+numberValue(item.sellingPrice)+'" inputmode="decimal" autocomplete="off" oninput="updateDailyOtherItem(this)"></div>'
                +'</div>'
                +'<div class="kk-prof-sales-row">'
                +'<div class="kk-sold-total-box"><span>Qty Sold</span><strong>'+numberValue(item.quantitySold)+'</strong></div>'
                +'<div class="kk-add-sold-control"><label>Add Sold</label><div class="kk-add-sold-control-row">'
                +'<input class="other-add-sold-qty mobile-large-input" type="number" min="1" max="999" step="1" value="1" inputmode="numeric" autocomplete="off" aria-label="Number of other items sold to add">'
                +'<button type="button" class="btn btn-primary btn-small" onclick="addDailyOtherSold(this)">ADD SOLD</button>'
                +'</div></div></div>'
                +'<div class="kk-prof-values">'
                +stage4Box('Total Sales',money(sales))
                +stage4Box('Profit',money(profit),profit)
                +stage4Box('Profit %',pct.toFixed(2)+'%',profit)
                +'</div>'
                +'<div class="kk-prof-other-actions"><button type="button" class="btn btn-danger btn-small" onclick="deleteDailyOtherItem(this)">Delete</button></div>';
            c.appendChild(d);
        });
    };
})();



/* V5 MOBILE ADD SOLD OVERFLOW FIX */

(function(){
    const style=document.createElement('style');
    style.id='kk-v5-add-sold-mobile-fix';
    style.textContent=`
        .menu-item,
        .kk-prof-sales-row,
        .kk-add-sold-control,
        .kk-add-sold-control-row,
        .kk-sold-total-box {
            box-sizing:border-box;
            max-width:100%;
        }

        .kk-prof-sales-row {
            width:100%;
            min-width:0;
        }

        .kk-add-sold-control-row {
            width:100%;
            min-width:0;
            display:flex;
            align-items:center;
            gap:6px;
        }

        .kk-add-sold-control-row input.mobile-large-input,
        .kk-add-sold-control-row input.stage4-add-sales-qty,
        .kk-add-sold-control-row input.other-add-sold-qty {
            box-sizing:border-box;
            flex:0 0 68px;
            width:68px;
            min-width:68px;
            max-width:68px;
            height:42px;
            padding:6px 7px;
            text-align:center;
            font-size:16px;
        }

        .kk-add-sold-control-row button {
            box-sizing:border-box;
            flex:1 1 auto;
            min-width:0;
            max-width:100%;
            height:42px;
            padding:6px 8px;
            overflow:hidden;
            white-space:nowrap;
        }

        @media (max-width:520px) {
            .menu-item {
                width:100%;
                max-width:100%;
                min-width:0;
                overflow:hidden;
            }

            .kk-prof-sales-row {
                grid-template-columns:minmax(0, 1fr) minmax(0, 1fr) !important;
                gap:7px !important;
            }

            .kk-add-sold-control {
                min-width:0 !important;
                width:100%;
                overflow:hidden;
            }

            .kk-add-sold-control-row {
                gap:5px;
            }

            .kk-add-sold-control-row input.mobile-large-input,
            .kk-add-sold-control-row input.stage4-add-sales-qty,
            .kk-add-sold-control-row input.other-add-sold-qty {
                flex-basis:62px;
                width:62px;
                min-width:62px;
                max-width:62px;
                height:40px;
                padding-left:4px;
                padding-right:4px;
            }

            .kk-add-sold-control-row button {
                height:40px;
                padding-left:5px;
                padding-right:5px;
                font-size:12px;
            }

            .kk-sold-total-box {
                min-width:0 !important;
                width:100%;
                overflow:hidden;
            }
        }

        @media (max-width:380px) {
            .kk-prof-sales-row {
                grid-template-columns:minmax(0, 1fr) !important;
            }

            .kk-add-sold-control-row input.mobile-large-input,
            .kk-add-sold-control-row input.stage4-add-sales-qty,
            .kk-add-sold-control-row input.other-add-sold-qty {
                flex-basis:64px;
                width:64px;
                min-width:64px;
                max-width:64px;
            }
        }
    `;
    document.head.appendChild(style);
})();



/* =========================================================
   V6 CORRECTED — CUMULATIVE SOLD +/- CONTROL
   IMPORTANT:
   This block changes ONLY the sold-quantity control.
   Existing V5 authentication, recipes, menu, sales, edit,
   delete, sold-out, Supabase and calculations are preserved.
========================================================= */
(function(){

    const style = document.createElement("style");
    style.id = "kk-v6-sold-plus-minus";
    style.textContent = `
        .kk-v6-sold-control{
            display:grid;
            grid-template-columns:40px minmax(0,1fr) 40px;
            gap:5px;
            width:100%;
            align-items:stretch;
        }

        .kk-v6-sold-control button{
            width:100%;
            min-width:0;
            height:40px;
            padding:0;
            font-size:20px;
            line-height:1;
            font-weight:700;
        }

        .kk-v6-sold-value{
            min-width:0;
            width:100%;
            height:40px;
            border-radius:8px;
            display:flex;
            align-items:center;
            justify-content:center;
            gap:5px;
            padding:0 5px;
            overflow:hidden;
            text-align:center;
            font-size:12px;
            font-weight:700;
            white-space:nowrap;
        }

        .kk-v6-sold-value strong{
            font-size:17px;
            line-height:1;
        }

        @media(max-width:380px){
            .kk-v6-sold-control{
                grid-template-columns:36px minmax(0,1fr) 36px;
                gap:4px;
            }

            .kk-v6-sold-control button{
                height:38px;
                font-size:18px;
            }

            .kk-v6-sold-value{
                height:38px;
                font-size:10px;
            }

            .kk-v6-sold-value strong{
                font-size:16px;
            }
        }
    `;
    document.head.appendChild(style);

    window.changeStage4SoldQuantity = function(btn, delta){
        const el = btn.closest(".menu-item");
        if(!el) return;

        const date =
            document.getElementById("menuDate").value ||
            todayString();

        const record = stage4TodayRecord(date);

        const item = record.foodItems.find(function(x){
            return String(x.id) === String(el.dataset.foodId);
        });

        if(!item) return;

        if(stage4IsFoodSoldOut(record, item.id)){
            showMessage(
                "menuMessage",
                "This food is marked Sold Out. Press Edit first to reactivate it.",
                "error"
            );
            return;
        }

        const current = Math.max(
            0,
            Math.floor(numberValue(item.servingsSold))
        );

        item.servingsSold = Math.max(0, current + delta);

        saveAllData();
        loadMenuOfDay();
        updateDashboard();
    };

    window.changeDailyOtherSoldQuantity = function(btn, delta){
        const el = btn.closest(".menu-item");
        if(!el) return;

        const date =
            document.getElementById("menuDate").value ||
            todayString();

        const record = stage4TodayRecord(date);

        const item = record.otherItems.find(function(x){
            return String(x.id) === String(el.dataset.otherId);
        });

        if(!item) return;

        const current = Math.max(
            0,
            Math.floor(numberValue(item.quantitySold))
        );

        item.quantitySold = Math.max(0, current + delta);

        saveAllData();
        renderDailyOtherItems(date);
        calculateCombinedSales(date);
        updateDashboard();
    };

    window.renderMenuItems = function(date){
        const c = document.getElementById("menuItems");
        if(!c) return;

        const record = stage4TodayRecord(date);

        c.innerHTML = "";

        if(!record.foodItems.length){
            c.innerHTML =
                '<div class="menu-empty">No food menus added yet.</div>';
            return;
        }

        record.foodItems.forEach(function(item){

            const sales =
                numberValue(item.sellingPrice) *
                numberValue(item.servingsSold);

            const profit =
                sales -
                numberValue(item.recipeCost);

            const pct =
                sales ? profit / sales * 100 : 0;

            const soldOut =
                stage4IsFoodSoldOut(record, item.id);

            const d = document.createElement("div");

            d.className =
                "menu-item" +
                (soldOut ? " stage4-food-sold-out" : "");

            d.dataset.foodId = item.id;

            const soldControl = soldOut
                ? '<div class="kk-prof-sales-row">' +
                    '<div class="kk-sold-total-box" style="grid-column:1 / -1">' +
                        '<span>Servings Sold</span>' +
                        '<strong>' +
                            numberValue(item.servingsSold) +
                        '</strong>' +
                    '</div>' +
                  '</div>'
                : '<div class="kk-prof-sales-row">' +
                    '<div class="kk-sold-total-box">' +
                        '<span>Servings Sold</span>' +
                        '<strong>' +
                            numberValue(item.servingsSold) +
                        '</strong>' +
                    '</div>' +

                    '<div class="kk-add-sold-control">' +
                        '<label>Sales</label>' +
                        '<div class="kk-v6-sold-control">' +

                            '<button type="button" ' +
                                'class="btn btn-secondary btn-small" ' +
                                'onclick="changeStage4SoldQuantity(this,-1)" ' +
                                'aria-label="Decrease sold quantity">−</button>' +

                            '<div class="kk-v6-sold-value">' +
                                '<span>SOLD</span>' +
                                '<strong>' +
                                    numberValue(item.servingsSold) +
                                '</strong>' +
                            '</div>' +

                            '<button type="button" ' +
                                'class="btn btn-secondary btn-small" ' +
                                'onclick="changeStage4SoldQuantity(this,1)" ' +
                                'aria-label="Increase sold quantity">+</button>' +

                        '</div>' +
                    '</div>' +
                  '</div>';

            const actions = soldOut
                ? '<div class="kk-prof-actions kk-one-action">' +
                    '<button type="button" class="btn btn-secondary btn-small" ' +
                        'onclick="editStage4Food(this)">Edit</button>' +
                  '</div>'
                : '<div class="kk-prof-actions">' +
                    '<button type="button" class="btn btn-danger btn-small" ' +
                        'onclick="deleteStage4Food(this)">Delete</button>' +
                    '<button type="button" class="btn btn-secondary btn-small" ' +
                        'onclick="soldOutStage4Food(this)">Sold Out</button>' +
                    '<button type="button" class="btn btn-secondary btn-small" ' +
                        'onclick="editStage4Food(this)">Edit</button>' +
                  '</div>';

            d.innerHTML =
                '<div class="kk-prof-card-title">' +
                    '<div>' +
                        '<div class="menu-name">' +
                            escapeHtml(item.recipeName) +
                        '</div>' +
                        (soldOut
                            ? '<div class="stage4-sold-out-label kk-prof-sold-label">SOLD OUT</div>'
                            : '') +
                    '</div>' +
                '</div>' +

                '<div class="kk-prof-values">' +
                    stage4Box(
                        "Recipe Cost",
                        money(item.recipeCost)
                    ) +
                    stage4Box(
                        "Selling / Serving",
                        money(item.sellingPrice)
                    ) +
                    stage4Box(
                        "Total Sales",
                        money(sales)
                    ) +
                    stage4Box(
                        "Profit",
                        money(profit),
                        profit
                    ) +
                    stage4Box(
                        "Profit %",
                        pct.toFixed(2) + "%",
                        profit
                    ) +
                '</div>' +

                soldControl +
                actions;

            c.appendChild(d);
        });
    };

    window.renderDailyOtherItems = function(date){
        const c =
            document.getElementById("dailyOtherItemsList");

        if(!c) return;

        const record = stage4TodayRecord(date);

        c.innerHTML = "";

        if(!record.otherItems.length){
            c.innerHTML =
                '<div class="menu-empty">No other items sold.</div>';
            return;
        }

        record.otherItems.forEach(function(item){

            const sales =
                numberValue(item.sellingPrice) *
                numberValue(item.quantitySold);

            const cost =
                numberValue(item.unitCost) *
                numberValue(item.quantitySold);

            const profit = sales - cost;

            const pct =
                sales ? profit / sales * 100 : 0;

            const d = document.createElement("div");

            d.className = "menu-item";
            d.dataset.otherId = item.id;

            d.innerHTML =
                '<div class="kk-prof-card-title">' +
                    '<div class="menu-name">' +
                        escapeHtml(item.name) +
                    '</div>' +
                '</div>' +

                '<div class="kk-prof-other-fields">' +
                    '<div class="form-group">' +
                        '<label>Unit</label>' +
                        '<input class="other-unit" type="text" ' +
                            'value="' + escapeHtml(item.unit || "") + '" readonly>' +
                    '</div>' +

                    '<div class="form-group">' +
                        '<label>Unit Cost</label>' +
                        '<input class="other-unit-cost" type="number" ' +
                            'value="' + numberValue(item.unitCost) + '" readonly>' +
                    '</div>' +

                    '<div class="form-group">' +
                        '<label>Selling Price</label>' +
                        '<input class="other-sale-price" type="number" ' +
                            'min="0" step="0.01" ' +
                            'value="' + numberValue(item.sellingPrice) + '" ' +
                            'inputmode="decimal" autocomplete="off" ' +
                            'oninput="updateDailyOtherItem(this)">' +
                    '</div>' +
                '</div>' +

                '<div class="kk-prof-sales-row">' +

                    '<div class="kk-sold-total-box">' +
                        '<span>Qty Sold</span>' +
                        '<strong>' +
                            numberValue(item.quantitySold) +
                        '</strong>' +
                    '</div>' +

                    '<div class="kk-add-sold-control">' +
                        '<label>Sales</label>' +
                        '<div class="kk-v6-sold-control">' +

                            '<button type="button" ' +
                                'class="btn btn-secondary btn-small" ' +
                                'onclick="changeDailyOtherSoldQuantity(this,-1)" ' +
                                'aria-label="Decrease sold quantity">−</button>' +

                            '<div class="kk-v6-sold-value">' +
                                '<span>SOLD</span>' +
                                '<strong>' +
                                    numberValue(item.quantitySold) +
                                '</strong>' +
                            '</div>' +

                            '<button type="button" ' +
                                'class="btn btn-secondary btn-small" ' +
                                'onclick="changeDailyOtherSoldQuantity(this,1)" ' +
                                'aria-label="Increase sold quantity">+</button>' +

                        '</div>' +
                    '</div>' +

                '</div>' +

                '<div class="kk-prof-values">' +
                    stage4Box(
                        "Total Sales",
                        money(sales)
                    ) +
                    stage4Box(
                        "Profit",
                        money(profit),
                        profit
                    ) +
                    stage4Box(
                        "Profit %",
                        pct.toFixed(2) + "%",
                        profit
                    ) +
                '</div>' +

                '<div class="kk-prof-other-actions">' +
                    '<button type="button" class="btn btn-danger btn-small" ' +
                        'onclick="deleteDailyOtherItem(this)">Delete</button>' +
                '</div>';

            c.appendChild(d);
        });
    };

    /*
       Re-render the currently displayed sales screen once the V6
       functions are installed. This is intentionally guarded so
       nothing runs before the app has initialized.
    */
    if(typeof document !== "undefined"){
        const refresh = function(){
            try{
                const dateEl = document.getElementById("menuDate");
                if(dateEl && dateEl.value && typeof loadMenuOfDay === "function"){
                    loadMenuOfDay();
                }
            }catch(error){
                console.error("V6 sales control refresh error:", error);
            }
        };

        if(document.readyState === "loading"){
            document.addEventListener("DOMContentLoaded", refresh, {once:true});
        }else{
            setTimeout(refresh, 0);
        }
    }

})();

/* =========================================================
   KARINDERYA KALKULATOR — PREMIUM MOBILE UI FINAL OVERRIDE
   - Compact 3 x 2 sales cards
   - Vertical + / quantity / − control
   - Removes the word SOLD
   - Larger mobile typography and touch targets
   - In-app delete confirmation (no browser confirm dialog)
   - Save Today's Sale success confirmation
   ========================================================= */
(function(){
    'use strict';

    /* ---------- PREMIUM UI STYLES ---------- */
    const style = document.createElement('style');
    style.id = 'kk-premium-final-ui';
    style.textContent = `
        .kk-premium-grid{
            display:grid !important;
            grid-template-columns:repeat(3,minmax(0,1fr));
            gap:8px;
            width:100%;
            align-items:stretch;
        }
        .kk-premium-grid .menu-summary-box,
        .kk-premium-grid .kk-premium-cell{
            min-width:0 !important;
            width:100%;
            box-sizing:border-box;
        }
        .kk-premium-cell{
            background:var(--card-bg,#f8fafc);
            border:1px solid rgba(100,116,139,.18);
            border-radius:10px;
            padding:9px 7px;
            min-height:66px;
            display:flex;
            flex-direction:column;
            justify-content:center;
            align-items:center;
            text-align:center;
            overflow:hidden;
        }
        .kk-premium-cell label,
        .kk-premium-cell span{
            display:block;
            font-size:12px !important;
            line-height:1.2;
            font-weight:600;
            opacity:.78;
            margin:0 0 4px;
            white-space:normal;
        }
        .kk-premium-cell strong{
            display:block;
            font-size:18px !important;
            line-height:1.15;
            font-weight:800;
            overflow-wrap:anywhere;
        }
        .kk-premium-food-title,
        .kk-premium-other-title{
            text-align:center;
            margin:2px 0 9px;
        }
        .kk-premium-food-title .menu-name,
        .kk-premium-other-title .menu-name{
            font-size:18px !important;
            line-height:1.2;
            font-weight:800 !important;
            letter-spacing:.1px;
            overflow-wrap:anywhere;
        }
        .kk-premium-sold-control{
            display:grid;
            grid-template-rows:30px 1fr 30px;
            width:44px;
            min-width:44px;
            gap:3px;
            margin:0 auto;
        }
        .kk-premium-sold-control button{
            width:44px !important;
            height:30px !important;
            min-height:30px !important;
            padding:0 !important;
            border-radius:8px !important;
            font-size:21px !important;
            line-height:1 !important;
            font-weight:800 !important;
        }
        .kk-premium-sold-value{
            width:44px;
            min-height:38px;
            display:flex;
            align-items:center;
            justify-content:center;
            font-size:18px;
            line-height:1;
            font-weight:800;
            border-radius:8px;
            background:rgba(15,23,42,.06);
            border:1px solid rgba(100,116,139,.16);
        }
        .kk-premium-sold-value strong{font-size:18px !important;}
        .kk-premium-actions{
            display:grid;
            grid-template-columns:repeat(3,minmax(0,1fr));
            gap:7px;
            margin-top:9px;
            padding-top:9px;
            border-top:1px solid rgba(100,116,139,.15);
        }
        .kk-premium-actions.kk-one-action{grid-template-columns:1fr;}
        .kk-premium-actions button,
        .kk-premium-delete button{
            min-height:40px !important;
            font-size:13px !important;
            font-weight:700 !important;
            border-radius:9px !important;
        }
        .kk-premium-delete{
            margin-top:8px;
            text-align:center;
            padding-top:8px;
            border-top:1px solid rgba(100,116,139,.15);
        }
        .kk-premium-delete button{width:100%;}
        .kk-premium-soldout{
            margin-top:4px;
            font-size:11px !important;
            font-weight:800 !important;
            letter-spacing:.7px;
        }
        .kk-premium-other-grid{
            display:grid !important;
            grid-template-columns:repeat(3,minmax(0,1fr));
            gap:8px;
            width:100%;
        }
        .kk-premium-other-grid .form-group{
            margin:0 !important;
            min-width:0;
            text-align:center;
        }
        .kk-premium-other-grid .form-group label{
            display:block;
            font-size:12px !important;
            line-height:1.2;
            font-weight:600;
            margin:0 0 4px;
            opacity:.78;
        }
        .kk-premium-other-grid input{
            width:100% !important;
            min-width:0 !important;
            height:42px !important;
            box-sizing:border-box;
            text-align:center;
            font-size:17px !important;
            font-weight:700;
            border-radius:9px !important;
        }
        .kk-premium-other-grid .kk-premium-cell{min-height:66px;}
        .menu-item{
            box-sizing:border-box;
            width:100%;
            max-width:100%;
            overflow:hidden;
        }
        .menu-empty{font-size:15px !important;line-height:1.4;}
        .saved-row-main strong,.saved-recipe-name{font-size:16px !important;font-weight:800 !important;}
        .saved-row-main span,.saved-recipe-cost{font-size:13px !important;}
        .saved-row-actions button{min-height:38px;font-size:13px !important;}

        /* Delete confirmation modal */
        .kk-confirm-backdrop{
            position:fixed;
            inset:0;
            z-index:99999;
            display:flex;
            align-items:center;
            justify-content:center;
            padding:20px;
            background:rgba(2,6,23,.62);
            backdrop-filter:blur(5px);
            -webkit-backdrop-filter:blur(5px);
        }
        .kk-confirm-modal{
            width:min(420px,100%);
            box-sizing:border-box;
            background:#fff;
            color:#0f172a;
            border-radius:18px;
            padding:22px;
            box-shadow:0 24px 70px rgba(0,0,0,.28);
            animation:kkModalIn .16s ease-out;
        }
        .kk-confirm-icon{
            width:48px;height:48px;
            margin:0 auto 12px;
            border-radius:14px;
            display:flex;align-items:center;justify-content:center;
            font-size:24px;font-weight:800;
            background:#fee2e2;color:#b91c1c;
        }
        .kk-confirm-title{
            text-align:center;
            font-size:19px;
            font-weight:800;
            margin:0 0 7px;
        }
        .kk-confirm-text{
            text-align:center;
            font-size:15px;
            line-height:1.45;
            margin:0 0 18px;
            color:#475569;
        }
        .kk-confirm-actions{display:grid;grid-template-columns:1fr 1fr;gap:9px;}
        .kk-confirm-actions button{
            min-height:46px;
            border:0;
            border-radius:10px;
            font-size:15px;
            font-weight:750;
            cursor:pointer;
        }
        .kk-confirm-cancel{background:#e2e8f0;color:#0f172a;}
        .kk-confirm-delete{background:#dc2626;color:#fff;}
        @keyframes kkModalIn{from{opacity:0;transform:translateY(8px) scale(.98)}to{opacity:1;transform:none}}

        /* Save confirmation toast */
        .kk-save-toast{
            position:fixed;
            left:50%;
            bottom:24px;
            transform:translateX(-50%);
            z-index:99998;
            width:min(420px,calc(100% - 32px));
            box-sizing:border-box;
            padding:13px 16px;
            border-radius:12px;
            background:#0f172a;
            color:#fff;
            text-align:center;
            font-size:15px;
            font-weight:750;
            box-shadow:0 12px 32px rgba(0,0,0,.22);
        }

        @media(max-width:520px){
            .kk-premium-grid,.kk-premium-other-grid{gap:6px;}
            .kk-premium-cell{min-height:62px;padding:8px 5px;border-radius:9px;}
            .kk-premium-cell label,.kk-premium-cell span,
            .kk-premium-other-grid .form-group label{font-size:11px !important;}
            .kk-premium-cell strong{font-size:17px !important;}
            .kk-premium-food-title .menu-name,
            .kk-premium-other-title .menu-name{font-size:17px !important;}
            .kk-premium-sold-control{width:40px;min-width:40px;grid-template-rows:28px 1fr 28px;gap:3px;}
            .kk-premium-sold-control button{width:40px !important;height:28px !important;min-height:28px !important;font-size:20px !important;}
            .kk-premium-sold-value{width:40px;min-height:34px;font-size:17px;}
            .kk-premium-sold-value strong{font-size:17px !important;}
            .kk-premium-actions{gap:5px;margin-top:8px;padding-top:8px;}
            .kk-premium-actions button,.kk-premium-delete button{min-height:39px !important;font-size:12px !important;}
            .kk-premium-other-grid input{height:40px !important;font-size:16px !important;}
            .kk-confirm-modal{padding:20px;border-radius:16px;}
        }
        @media(max-width:380px){
            .kk-premium-grid,.kk-premium-other-grid{gap:4px;}
            .kk-premium-cell{min-height:58px;padding:7px 3px;}
            .kk-premium-cell strong{font-size:16px !important;}
            .kk-premium-cell label,.kk-premium-cell span,
            .kk-premium-other-grid .form-group label{font-size:10px !important;}
            .kk-premium-actions button,.kk-premium-delete button{font-size:11px !important;min-height:37px !important;}
        }
    `;
    document.head.appendChild(style);

    /* ---------- IN-APP CONFIRMATION ---------- */
    window.kkConfirm = function(message, title){
        return new Promise(function(resolve){
            const old=document.getElementById('kkConfirmBackdrop');
            if(old)old.remove();

            const backdrop=document.createElement('div');
            backdrop.id='kkConfirmBackdrop';
            backdrop.className='kk-confirm-backdrop';
            backdrop.innerHTML=
                '<div class="kk-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="kkConfirmTitle">'+
                    '<div class="kk-confirm-icon">!</div>'+
                    '<h3 id="kkConfirmTitle" class="kk-confirm-title">'+escapeHtml(title||'Confirm deletion')+'</h3>'+
                    '<p class="kk-confirm-text">'+escapeHtml(message||'Are you sure you want to delete this item?')+'</p>'+ 
                    '<div class="kk-confirm-actions">'+
                        '<button type="button" class="kk-confirm-cancel" data-action="cancel">Cancel</button>'+ 
                        '<button type="button" class="kk-confirm-delete" data-action="delete">Delete</button>'+ 
                    '</div>'+ 
                '</div>';

            document.body.appendChild(backdrop);
            const close=function(result){
                if(backdrop.parentNode)backdrop.parentNode.removeChild(backdrop);
                resolve(result);
            };
            backdrop.querySelector('[data-action="cancel"]').onclick=function(){close(false);};
            backdrop.querySelector('[data-action="delete"]').onclick=function(){close(true);};
            backdrop.addEventListener('click',function(e){if(e.target===backdrop)close(false);});
            const onKey=function(e){
                if(e.key==='Escape'){document.removeEventListener('keydown',onKey);close(false);}
                if(e.key==='Enter'){document.removeEventListener('keydown',onKey);close(true);}
            };
            document.addEventListener('keydown',onKey);
            setTimeout(function(){const b=backdrop.querySelector('[data-action="cancel"]');if(b)b.focus();},0);
        });
    };

    window.kkShowSaveSuccess=function(message){
        const old=document.getElementById('kkSaveToast');
        if(old)old.remove();
        const toast=document.createElement('div');
        toast.id='kkSaveToast';
        toast.className='kk-save-toast';
        toast.textContent='✓ '+(message||"Today's sales saved successfully.");
        document.body.appendChild(toast);
        setTimeout(function(){if(toast.parentNode)toast.parentNode.removeChild(toast);},4000);
    };

    /* ---------- ALL DELETE ACTIONS ---------- */
    window.deleteIngredient=async function(id){
        if(!await window.kkConfirm('Delete this ingredient?','Delete ingredient'))return;
        const userId=await getCurrentUserId();
        if(!userId)return;
        const {error}=await supabaseClient.from('ingredients').delete().eq('id',Number(id)).eq('user_id',userId);
        if(error){console.error(error);showMessage('ingredientMessage','Unable to delete ingredient.','error');return;}
        await renderIngredientList();
        showMessage('ingredientMessage','Ingredient deleted successfully.','success');
    };

    window.deleteOtherItem=async function(id){
        if(!await window.kkConfirm('Delete this other item?','Delete other item'))return;
        const userId=await getCurrentUserId();
        if(!userId)return;
        const {error}=await supabaseClient.from('other_items').delete().eq('id',Number(id)).eq('user_id',userId);
        if(error){console.error(error);showMessage('otherItemMessage','Unable to delete other item.','error');return;}
        await renderOtherItemList();
        showMessage('otherItemMessage','Other item deleted successfully.','success');
    };

    window.deleteSavedRecipe=async function(id){
        if(!await window.kkConfirm('Delete this recipe? This cannot be undone.','Delete recipe'))return;
        savedRecipes=savedRecipes.filter(function(recipe){return String(recipe.id)!==String(id);});
        saveAllData();
        loadSavedRecipes();
        loadMenuOfDay();
        showMessage('recipeMessage','Recipe deleted successfully.','success');
    };

    window.deleteStage4Food=async function(btn){
        const el=btn&&btn.closest?btn.closest('.menu-item'):null;
        if(!el)return;
        if(!await window.kkConfirm('Delete this food sale? This cannot be undone.','Delete food sale'))return;
        const date=document.getElementById('menuDate').value||todayString();
        const record=stage4TodayRecord(date);
        record.foodItems=record.foodItems.filter(function(x){return String(x.id)!==String(el.dataset.foodId);});
        setStage4FoodSoldOut(record,el.dataset.foodId,false);
        saveAllData();
        loadMenuOfDay();
        updateDashboard();
    };

    window.deleteDailyOtherItem=async function(btn){
        const el=btn&&btn.closest?btn.closest('.menu-item'):null;
        if(!el)return;
        if(!await window.kkConfirm('Delete this other item sale? This cannot be undone.','Delete other item sale'))return;
        const date=document.getElementById('menuDate').value||todayString();
        const record=stage4TodayRecord(date);
        record.otherItems=record.otherItems.filter(function(x){return String(x.id)!==String(el.dataset.otherId);});
        saveAllData();
        loadMenuOfDay();
        updateDashboard();
    };

    /* Older Daily Sales screen delete actions are also protected. */
    window.deleteSalesFoodItem=async function(rowId){
        if(!await window.kkConfirm('Delete this food sale? This cannot be undone.','Delete food sale'))return;
        const date=document.getElementById('salesDate').value;
        const record=getSavedDailySales(date);
        if(!record||!Array.isArray(record.foodItems))return;
        record.foodItems=record.foodItems.filter(function(item){return String(item.id)!==String(rowId);});
        saveAllData();
        loadDailySales();
    };

    window.deleteSalesOtherItem=async function(rowId){
        if(!await window.kkConfirm('Delete this other item sale? This cannot be undone.','Delete other item sale'))return;
        const date=document.getElementById('salesDate').value;
        const record=getSavedDailySales(date);
        if(!record||!Array.isArray(record.otherItems))return;
        record.otherItems=record.otherItems.filter(function(item){return String(item.id)!==String(rowId);});
        saveAllData();
        loadDailySales();
    };

    /* ---------- PREMIUM FOOD CARDS: EXACT 3 x 2 ---------- */
    window.renderMenuItems=function(date){
        const c=document.getElementById('menuItems');
        if(!c)return;
        const record=stage4TodayRecord(date);
        c.innerHTML='';
        if(!record.foodItems.length){c.innerHTML='<div class="menu-empty">No food menus added yet.</div>';return;}

        record.foodItems.forEach(function(item){
            const sales=numberValue(item.sellingPrice)*numberValue(item.servingsSold);
            const profit=sales-numberValue(item.recipeCost);
            const pct=sales?profit/sales*100:0;
            const soldOut=stage4IsFoodSoldOut(record,item.id);
            const d=document.createElement('div');
            d.className='menu-item'+(soldOut?' stage4-food-sold-out':'');
            d.dataset.foodId=item.id;

            const control=soldOut
                ? '<div class="kk-premium-cell"><span>Servings Sold</span><strong>'+numberValue(item.servingsSold)+'</strong></div>'
                : '<div class="kk-premium-cell"><span>Servings Sold</span><div class="kk-premium-sold-control">'+
                    '<button type="button" class="btn btn-secondary btn-small" onclick="changeStage4SoldQuantity(this,1)" aria-label="Increase servings sold">+</button>'+
                    '<div class="kk-premium-sold-value"><strong>'+numberValue(item.servingsSold)+'</strong></div>'+
                    '<button type="button" class="btn btn-secondary btn-small" onclick="changeStage4SoldQuantity(this,-1)" aria-label="Decrease servings sold">−</button>'+
                  '</div></div>';

            const actions=soldOut
                ? '<div class="kk-premium-actions kk-one-action"><button type="button" class="btn btn-secondary btn-small" onclick="editStage4Food(this)">Edit</button></div>'
                : '<div class="kk-premium-actions">'+
                    '<button type="button" class="btn btn-danger btn-small" onclick="deleteStage4Food(this)">Delete</button>'+
                    '<button type="button" class="btn btn-secondary btn-small" onclick="soldOutStage4Food(this)">Sold Out</button>'+
                    '<button type="button" class="btn btn-secondary btn-small" onclick="editStage4Food(this)">Edit</button>'+ 
                  '</div>';

            d.innerHTML=
                '<div class="kk-premium-food-title"><div class="menu-name">'+escapeHtml(item.recipeName)+'</div>'+(soldOut?'<div class="stage4-sold-out-label kk-premium-soldout">SOLD OUT</div>':'')+'</div>'+ 
                '<div class="kk-premium-grid">'+
                    stage4Box('Recipe Cost',money(item.recipeCost))+ 
                    stage4Box('Selling / Serving',money(item.sellingPrice))+ 
                    stage4Box('Total Sales',money(sales))+ 
                    stage4Box('Profit',money(profit),profit)+ 
                    stage4Box('Profit %',pct.toFixed(2)+'%',profit)+ 
                    control+
                '</div>'+actions;
            c.appendChild(d);
        });
    };

    /* ---------- PREMIUM OTHER ITEM CARDS: EXACT 3 x 2 ---------- */
    window.renderDailyOtherItems=function(date){
        const c=document.getElementById('dailyOtherItemsList');
        if(!c)return;
        const record=stage4TodayRecord(date);
        c.innerHTML='';
        if(!record.otherItems.length){c.innerHTML='<div class="menu-empty">No other items sold.</div>';return;}

        record.otherItems.forEach(function(item){
            const sales=numberValue(item.sellingPrice)*numberValue(item.quantitySold);
            const cost=numberValue(item.unitCost)*numberValue(item.quantitySold);
            const profit=sales-cost;
            const d=document.createElement('div');
            d.className='menu-item';
            d.dataset.otherId=item.id;
            d.innerHTML=
                '<div class="kk-premium-other-title"><div class="menu-name">'+escapeHtml(item.name)+'</div></div>'+ 
                '<div class="kk-premium-other-grid">'+
                    '<div class="form-group"><label>Selling Price</label><input class="other-sale-price" type="number" min="0" step="0.01" value="'+numberValue(item.sellingPrice)+'" inputmode="decimal" autocomplete="off" oninput="updateDailyOtherItem(this)"></div>'+ 
                    '<div class="form-group"><label>Unit Cost</label><input class="other-unit-cost" type="number" value="'+numberValue(item.unitCost)+'" readonly></div>'+ 
                    '<div class="form-group"><label>Unit</label><input class="other-unit" type="text" value="'+escapeHtml(item.unit||'')+'" readonly></div>'+ 
                    '<div class="kk-premium-cell"><span>Total Sales</span><strong>'+money(sales)+'</strong></div>'+ 
                    '<div class="kk-premium-cell"><span>Profit</span><strong class="'+(profit>0?'profit-positive':profit<0?'profit-negative':'')+'">'+money(profit)+'</strong></div>'+ 
                    '<div class="kk-premium-cell"><span>Qty Sold</span><div class="kk-premium-sold-control">'+
                        '<button type="button" class="btn btn-secondary btn-small" onclick="changeDailyOtherSoldQuantity(this,1)" aria-label="Increase quantity sold">+</button>'+ 
                        '<div class="kk-premium-sold-value"><strong>'+numberValue(item.quantitySold)+'</strong></div>'+ 
                        '<button type="button" class="btn btn-secondary btn-small" onclick="changeDailyOtherSoldQuantity(this,-1)" aria-label="Decrease quantity sold">−</button>'+ 
                    '</div></div>'+ 
                '</div>'+ 
                '<div class="kk-premium-delete"><button type="button" class="btn btn-danger btn-small" onclick="deleteDailyOtherItem(this)">Delete</button></div>';
            c.appendChild(d);
        });
    };

    /* ---------- SAVE CONFIRMATION ---------- */
    window.saveCombinedMenuSales=function(){
        const date=document.getElementById('menuDate').value||todayString();
        calculateCombinedSales(date);
        showMessage('menuMessage',"Today's Menu & Sales saved successfully.",'success');
        window.kkShowSaveSuccess("Today's sales saved successfully.");
    };

})();


/* =========================================================
   KARINDERYA KALKULATOR — PREMIUM PROFIT CALCULATOR OPEX V2
   - Mobile-first 4-column OPEX grid
   - Monthly Rent / Electricity / Water / WiFi allocation
   - Actual LPG/Gas and Other daily amounts
   - Dynamic employee labor table (NO manual labor input)
   - Historical daily OPEX snapshots
   ========================================================= */
(function(){
    'use strict';

    const OPEX_STYLE_ID = 'kk-premium-opex-v2';

    function ensureOpexStyles(){
        if(document.getElementById(OPEX_STYLE_ID)) return;
        const style=document.createElement('style');
        style.id=OPEX_STYLE_ID;
        style.textContent=`
            .kk-opex-card{margin-top:12px}
            .kk-opex-grid{
                display:grid;
                grid-template-columns:repeat(4,minmax(0,1fr));
                gap:8px;
                width:100%;
            }
            .kk-opex-item{
                min-width:0;
                border:1px solid #d9e2ec;
                border-radius:12px;
                background:#f8fafc;
                padding:10px 7px;
                box-sizing:border-box;
                text-align:center;
            }
            .kk-opex-item .kk-opex-title{
                font-size:13px;
                font-weight:800;
                line-height:1.2;
                margin-bottom:6px;
                color:#123b63;
            }
            .kk-opex-item input{
                width:100%;
                box-sizing:border-box;
                min-height:42px;
                padding:7px 5px;
                text-align:center;
                font-size:17px;
                font-weight:700;
                border:1px solid #cbd5e1;
                border-radius:8px;
                background:#fff;
            }
            .kk-opex-item .kk-opex-caption{
                font-size:10px;
                font-weight:600;
                color:#64748b;
                line-height:1.2;
                margin-top:4px;
            }
            .kk-opex-item .kk-opex-daily{
                font-size:12px;
                font-weight:800;
                color:#123b63;
                margin-top:4px;
                line-height:1.2;
            }
            .kk-opex-labor-value{
                min-height:42px;
                display:flex;
                align-items:center;
                justify-content:center;
                font-size:17px;
                font-weight:800;
                color:#123b63;
                background:#eef4f9;
                border:1px solid #cbd5e1;
                border-radius:8px;
                box-sizing:border-box;
            }
            .kk-opex-total{
                grid-column:1/-1;
                border-radius:12px;
                padding:11px 12px;
                background:#123b63;
                color:#fff;
                display:flex;
                justify-content:space-between;
                align-items:center;
                gap:10px;
            }
            .kk-opex-total span{font-size:13px;font-weight:700}
            .kk-opex-total strong{font-size:19px;font-weight:900}
            .kk-labor-card{
                margin-top:10px;
                border:1px solid #d9e2ec;
                border-radius:12px;
                padding:12px;
                background:#fff;
            }
            .kk-labor-header{
                display:flex;
                align-items:center;
                justify-content:space-between;
                gap:8px;
                margin-bottom:10px;
            }
            .kk-labor-title{font-size:17px;font-weight:850;color:#123b63}
            .kk-labor-table{width:100%;border-collapse:separate;border-spacing:0 6px}
            .kk-labor-table th{
                font-size:11px;
                color:#64748b;
                text-align:left;
                padding:0 5px 2px;
            }
            .kk-labor-table td{padding:0 4px;vertical-align:middle}
            .kk-labor-table input[type=text],
            .kk-labor-table input[type=number]{
                width:100%;box-sizing:border-box;min-height:42px;
                border:1px solid #cbd5e1;border-radius:8px;
                padding:7px 8px;font-size:16px;background:#fff;
            }
            .kk-labor-table input[type=number]{text-align:center;font-weight:700}
            .kk-present-wrap{
                display:flex;justify-content:center;align-items:center;min-height:42px;
            }
            .kk-present-wrap input{width:21px;height:21px}
            .kk-labor-delete{
                width:42px;min-width:42px;height:42px;
                padding:0!important;font-size:18px!important;
            }
            .kk-labor-empty{font-size:13px;color:#64748b;text-align:center;padding:8px}
            .kk-profit-result-grid{
                display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:10px
            }
            .kk-profit-result-box{
                border:1px solid #d9e2ec;border-radius:10px;padding:10px;text-align:center;background:#f8fafc
            }
            .kk-profit-result-box span{display:block;font-size:11px;color:#64748b;font-weight:700}
            .kk-profit-result-box strong{display:block;font-size:18px;margin-top:3px;font-weight:900}
            .kk-net-profit-box{
                grid-column:1/-1;padding:14px;border-radius:12px;text-align:center;background:#eef4f9;border:1px solid #cbd5e1
            }
            .kk-net-profit-box span{display:block;font-size:12px;font-weight:800;letter-spacing:.4px}
            .kk-net-profit-box strong{display:block;font-size:27px;font-weight:950;margin-top:3px}
            .kk-profit-positive{color:#15803d!important}.kk-profit-negative{color:#c62828!important}
            @media(max-width:600px){
                .kk-opex-grid{grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}
                .kk-opex-item{padding:8px 4px;border-radius:10px}
                .kk-opex-item .kk-opex-title{font-size:12px}
                .kk-opex-item input{font-size:15px;min-height:44px;padding:6px 3px}
                .kk-opex-item .kk-opex-caption{font-size:9px}
                .kk-opex-item .kk-opex-daily{font-size:10px}
                .kk-opex-labor-value{font-size:14px;min-height:44px}
                .kk-opex-total strong{font-size:18px}
                .kk-labor-card{padding:10px}
                .kk-labor-table th{font-size:10px}
                .kk-labor-table td{padding:0 2px}
                .kk-labor-table input[type=text],.kk-labor-table input[type=number]{min-height:44px;font-size:15px;padding:6px}
                .kk-labor-delete{width:40px;min-width:40px;height:44px}
            }
            @media(max-width:390px){
                .kk-opex-item .kk-opex-title{font-size:11px}
                .kk-opex-item input{font-size:14px}
                .kk-labor-table th{font-size:9px}
                .kk-labor-table input[type=text],.kk-labor-table input[type=number]{font-size:14px}
            }
        `;
        document.head.appendChild(style);
    }

    function n(v){ return typeof numberValue==='function' ? numberValue(v) : (parseFloat(v)||0); }
    function m(v){ return typeof money==='function' ? money(v) : '₱'+n(v).toFixed(2); }
    function today(){ return typeof todayString==='function' ? todayString() : new Date().toISOString().slice(0,10); }

    function previousRecord(date){
        if(!Array.isArray(profitRecords)) return null;
        return profitRecords
            .filter(function(r){return r && r.date && r.date < date;})
            .sort(function(a,b){return String(b.date).localeCompare(String(a.date));})[0] || null;
    }

    function defaultEmployees(){
        return [
            {id:'emp_'+Date.now()+'_1',name:'Employee 1',dailyRate:0,present:true},
            {id:'emp_'+Date.now()+'_2',name:'Employee 2',dailyRate:0,present:true}
        ];
    }

    function normalizeEmployees(list){
        if(!Array.isArray(list) || !list.length) return defaultEmployees();
        return list.map(function(e,i){
            return {
                id:String(e.id || ('emp_'+Date.now()+'_'+i)),
                name:String(e.name || ('Employee '+(i+1))),
                dailyRate:n(e.dailyRate),
                present:e.present !== false
            };
        });
    }

    function legacyToOpex(record){
        const e=record && record.expenses ? record.expenses : {};
        return {
            monthlyRent:n(e.rent)*30,
            gas:n(e.gas),
            electricityMonthly:n(e.electricity)*30,
            waterMonthly:n(e.water)*30,
            wifiMonthly:n(e.wifi)*30,
            other:n(e.other),
            employees:e.labor>0 ? [{id:'legacy_labor',name:'Employee 1',dailyRate:n(e.labor),present:true}] : defaultEmployees()
        };
    }

    function getOpexForDate(date){
        const existing=profitRecords.find(function(r){return r.date===date;});
        if(existing && existing.opex) return {
            monthlyRent:n(existing.opex.monthlyRent),
            gas:n(existing.opex.gas),
            electricityMonthly:n(existing.opex.electricityMonthly),
            waterMonthly:n(existing.opex.waterMonthly),
            wifiMonthly:n(existing.opex.wifiMonthly),
            other:n(existing.opex.other),
            employees:normalizeEmployees(existing.opex.employees)
        };
        if(existing && existing.expenses) return legacyToOpex(existing);
        const prev=previousRecord(date);
        if(prev && prev.opex) return {
            monthlyRent:n(prev.opex.monthlyRent),
            gas:0,
            electricityMonthly:n(prev.opex.electricityMonthly),
            waterMonthly:n(prev.opex.waterMonthly),
            wifiMonthly:n(prev.opex.wifiMonthly),
            other:0,
            employees:normalizeEmployees(prev.opex.employees).map(function(e){return Object.assign({},e,{present:true});})
        };
        if(prev && prev.expenses){
            const x=legacyToOpex(prev);
            x.gas=0;x.other=0;
            return x;
        }
        return {monthlyRent:0,gas:0,electricityMonthly:0,waterMonthly:0,wifiMonthly:0,other:0,employees:defaultEmployees()};
    }

    function getInputs(){
        return {
            monthlyRent:n(document.getElementById('kkMonthlyRent')?.value),
            gas:n(document.getElementById('kkGasActual')?.value),
            electricityMonthly:n(document.getElementById('kkElectricityMonthly')?.value),
            waterMonthly:n(document.getElementById('kkWaterMonthly')?.value),
            wifiMonthly:n(document.getElementById('kkWifiMonthly')?.value),
            other:n(document.getElementById('kkOtherDaily')?.value),
            employees:getEmployeesFromUI()
        };
    }

    function getEmployeesFromUI(){
        return Array.from(document.querySelectorAll('.kk-employee-row')).map(function(row,i){
            return {
                id:String(row.dataset.id || ('emp_'+Date.now()+'_'+i)),
                name:String(row.querySelector('.kk-employee-name')?.value || ('Employee '+(i+1))).trim() || ('Employee '+(i+1)),
                dailyRate:n(row.querySelector('.kk-employee-rate')?.value),
                present:!!row.querySelector('.kk-employee-present')?.checked
            };
        });
    }

    function laborTotal(employees){
        return (employees||[]).reduce(function(sum,e){return sum+(e.present?n(e.dailyRate):0);},0);
    }

    function buildProfitOpexUI(opex){
        const profit=document.getElementById('profitScreen');
        if(!profit) return;
        ensureOpexStyles();
        let card=document.getElementById('kkProfitOpexCard');
        if(!card){
            const oldInput=document.getElementById('expenseRent');
            card=oldInput ? oldInput.closest('.card') : null;
            if(!card){
                card=document.createElement('div');
                profit.appendChild(card);
            }
            card.id='kkProfitOpexCard';
        }
        card.className='card kk-opex-card';
        card.innerHTML=''+
            '<div class="section-title" style="font-size:19px">Operating Expenses</div>'+
            '<div class="small-text" style="margin-bottom:10px">Monthly expenses are converted to a daily cost. Gas and Other are entered as actual daily amounts.</div>'+
            '<div class="kk-opex-grid">'+
                opexInput('🏠','Rent','Monthly','kkMonthlyRent',opex.monthlyRent,'Monthly Rent')+
                opexInput('🔥','Gas / LPG','Actual','kkGasActual',opex.gas,'Daily Gas')+
                opexInput('⚡','Electricity','Previous Bill','kkElectricityMonthly',opex.electricityMonthly,'Monthly Bill')+
                opexInput('💧','Water','Previous Bill','kkWaterMonthly',opex.waterMonthly,'Monthly Bill')+
                opexInput('📶','WiFi','Monthly','kkWifiMonthly',opex.wifiMonthly,'Monthly Bill')+
                opexInput('📦','Other','Actual','kkOtherDaily',opex.other,'Daily Other')+
                '<div class="kk-opex-item"><div class="kk-opex-title">👷 Labor</div><div id="kkLaborTotalValue" class="kk-opex-labor-value">'+m(laborTotal(opex.employees))+'</div><div class="kk-opex-caption">Auto from employees</div></div>'+ 
                '<div class="kk-opex-total"><span>Total OPEX</span><strong id="kkOpexTotal">₱0.00</strong></div>'+ 
            '</div>'+
            '<div class="button-row" style="margin-top:10px">'+
                '<button type="button" class="btn btn-primary" id="kkCalculatePremiumBtn">Calculate</button>'+
                '<button type="button" class="btn btn-success" id="kkSaveProfitBtn">Save Profit Record</button>'+
            '</div>'+
            '<div id="profitMessage" class="message"></div>';

        let labor=document.getElementById('kkLaborCard');
        if(!labor){
            labor=document.createElement('div');
            labor.id='kkLaborCard';
            card.insertAdjacentElement('afterend',labor);
        }
        labor.className='kk-labor-card';
        labor.innerHTML='<div class="kk-labor-header"><div class="kk-labor-title">👷 Employees / Labor</div><button type="button" class="btn btn-primary btn-small" id="kkAddEmployeeBtn">＋ Add Employee</button></div>'+
            '<div id="kkEmployeeTableWrap"></div>';
        renderEmployees(opex.employees);

        ['kkMonthlyRent','kkGasActual','kkElectricityMonthly','kkWaterMonthly','kkWifiMonthly','kkOtherDaily'].forEach(function(id){
            const el=document.getElementById(id); if(el)el.addEventListener('input',calculateProfit);
        });
        document.getElementById('kkAddEmployeeBtn').onclick=function(){
            const employees=getEmployeesFromUI();
            employees.push({id:'emp_'+Date.now()+'_'+employees.length,name:'Employee '+(employees.length+1),dailyRate:0,present:true});
            renderEmployees(employees); calculateProfit();
        };
        syncHiddenLegacyInputs();
    }

    function opexInput(icon,title,caption,id,value,sub){
        return '<div class="kk-opex-item"><div class="kk-opex-title">'+icon+' '+title+'</div><input id="'+id+'" type="number" min="0" step="0.01" inputmode="decimal" value="'+n(value)+'" aria-label="'+title+' '+caption+'"><div class="kk-opex-caption">'+caption+'</div><div class="kk-opex-daily" id="'+id+'Daily">Daily: ₱0.00</div></div>';
    }

    function renderEmployees(employees){
        const wrap=document.getElementById('kkEmployeeTableWrap'); if(!wrap)return;
        employees=normalizeEmployees(employees);
        let html='<table class="kk-labor-table"><thead><tr><th style="width:42%">Employee</th><th style="width:28%">Daily Rate</th><th style="width:18%;text-align:center">Present</th><th style="width:12%"></th></tr></thead><tbody>';
        employees.forEach(function(e,i){
            html+='<tr class="kk-employee-row" data-id="'+escapeAttr(e.id)+'">'+
                '<td><input class="kk-employee-name" type="text" value="'+escapeAttr(e.name)+'" placeholder="Employee '+(i+1)+'"></td>'+
                '<td><input class="kk-employee-rate" type="number" min="0" step="0.01" inputmode="decimal" value="'+n(e.dailyRate)+'" placeholder="₱0"></td>'+
                '<td><div class="kk-present-wrap"><input class="kk-employee-present" type="checkbox" '+(e.present?'checked':'')+' aria-label="Employee '+(i+1)+' present"></div></td>'+
                '<td><button type="button" class="btn btn-danger btn-small kk-labor-delete" aria-label="Delete employee">×</button></td>'+
            '</tr>';
        });
        html+='</tbody></table>';
        wrap.innerHTML=html;
        if(!employees.length)wrap.innerHTML='<div class="kk-labor-empty">No employees added.</div>';
        wrap.querySelectorAll('.kk-employee-row').forEach(function(row){
            row.querySelectorAll('input').forEach(function(el){el.addEventListener('input',calculateProfit);el.addEventListener('change',calculateProfit);});
            row.querySelector('.kk-labor-delete').onclick=function(){
                if(typeof window.kkPremiumConfirmDelete==='function'){
                    window.kkPremiumConfirmDelete('Delete this employee?',function(){
                        const current=getEmployeesFromUI().filter(function(e){return e.id!==row.dataset.id;});
                        renderEmployees(current);calculateProfit();
                    });
                }else{
                    const current=getEmployeesFromUI().filter(function(e){return e.id!==row.dataset.id;});
                    renderEmployees(current);calculateProfit();
                }
            };
        });
    }

    function syncHiddenLegacyInputs(){
        const map={
            expenseRent:'kkMonthlyRent',expenseGas:'kkGasActual',expenseElectricity:'kkElectricityMonthly',expenseWater:'kkWaterMonthly',expenseWifi:'kkWifiMonthly'
        };
        Object.keys(map).forEach(function(oldId){
            const old=document.getElementById(oldId), neo=document.getElementById(map[oldId]);
            if(old)old.style.display='none';
            if(old&&neo)old.value=n(neo.value)/30;
        });
        const labor=document.getElementById('expenseLabor'); if(labor)labor.style.display='none';
        const other=document.getElementById('expenseOther'); if(other)other.style.display='none';
    }

    function updateDailyLabels(opex, employees){
        const vals={
            kkMonthlyRent:n(opex.monthlyRent)/30,
            kkGasActual:n(opex.gas),
            kkElectricityMonthly:n(opex.electricityMonthly)/30,
            kkWaterMonthly:n(opex.waterMonthly)/30,
            kkWifiMonthly:n(opex.wifiMonthly)/30
        };
        Object.keys(vals).forEach(function(id){
            const el=document.getElementById(id+'Daily');if(el)el.textContent='Daily: '+m(vals[id]);
        });
        const labor=laborTotal(employees);
        const le=document.getElementById('kkLaborTotalValue');if(le)le.textContent=m(labor);
        const total=Object.values(vals).reduce(function(a,b){return a+b;},0)+labor+n(opex.other);
        const ot=document.getElementById('kkOpexTotal');if(ot)ot.textContent=m(total);
        const otherDaily=document.getElementById('kkOtherDailyDaily');if(otherDaily)otherDaily.textContent='Daily: '+m(opex.other);
        syncHiddenLegacyInputs();
        return {rent:vals.kkMonthlyRent,gas:vals.kkGasActual,electricity:vals.kkElectricityMonthly,water:vals.kkWaterMonthly,wifi:vals.kkWifiMonthly,labor:labor,other:n(opex.other),total:total};
    }

    window.calculateProfit=function(){
        const foodSales=n((document.getElementById('profitFoodSales')?.textContent||'').replace(/[₱,]/g,''));
        const otherSales=n((document.getElementById('profitOtherSales')?.textContent||'').replace(/[₱,]/g,''));
        const foodCost=n((document.getElementById('profitFoodCost')?.textContent||'').replace(/[₱,]/g,''));
        const otherCost=n((document.getElementById('profitOtherCost')?.textContent||'').replace(/[₱,]/g,''));
        const totalSales=foodSales+otherSales;
        const totalCost=foodCost+otherCost;
        const grossProfit=totalSales-totalCost;
        const opex=getInputs();
        const daily=updateDailyLabels(opex,opex.employees);
        const netProfit=grossProfit-daily.total;
        const netPct=totalSales>0 ? (netProfit/totalSales*100) : 0;
        const gp=document.getElementById('profitGrossProfit');if(gp)gp.textContent=m(grossProfit);
        const te=document.getElementById('profitTotalSales');if(te)te.textContent=m(totalSales);
        const tc=document.getElementById('profitTotalCost');if(tc)tc.textContent=m(totalCost);
        const pe=document.getElementById('profitExpenses');if(pe)pe.textContent=m(daily.total);
        const np=document.getElementById('profitNetProfit');if(np)np.textContent=m(netProfit);
        const npEl=document.getElementById('kkNetProfitPercent');if(npEl)npEl.textContent=netPct.toFixed(2)+'%';
        const gpp=document.getElementById('kkGrossProfitPremium');if(gpp)gpp.textContent=m(grossProfit);
        const top=document.getElementById('kkTotalOpexPremium');if(top)top.textContent=m(daily.total);
        const npp=document.getElementById('kkNetProfitPremium');if(npp){npp.textContent=m(netProfit);npp.classList.toggle('kk-profit-positive',netProfit>0);npp.classList.toggle('kk-profit-negative',netProfit<0);}
        return {foodSales,otherSales,totalSales,foodCost,otherCost,totalCost,grossProfit,expenses:daily.total,netProfit,netProfitPercent:netPct,opex:opex,dailyOpex:daily};
    };

    window.loadProfitCalculator=function(){
        const dateInput=document.getElementById('profitDate');if(!dateInput)return;
        if(!dateInput.value)dateInput.value=today();
        const date=dateInput.value;
        const sales=typeof getSavedDailySales==='function'?getSavedDailySales(date):null;
        const foodSales=sales?n(sales.foodSales):0, otherSales=sales?n(sales.otherSales):0, foodCost=sales?n(sales.foodCost):0, otherCost=sales?n(sales.otherCost):0;
        const setText=function(id,val){const el=document.getElementById(id);if(el)el.textContent=m(val);};
        setText('profitFoodSales',foodSales);setText('profitOtherSales',otherSales);setText('profitTotalSales',foodSales+otherSales);
        setText('profitFoodCost',foodCost);setText('profitOtherCost',otherCost);setText('profitTotalCost',foodCost+otherCost);setText('profitGrossProfit',foodSales+otherSales-foodCost-otherCost);
        const opex=getOpexForDate(date);
        buildProfitOpexUI(opex);
        ensureProfitResultUI();
        calculateProfit();
    };

    window.loadProfitForDate=window.loadProfitCalculator;

    function ensureProfitResultUI(){
        const card=document.getElementById('kkProfitOpexCard');if(!card)return;
        let result=document.getElementById('kkProfitResultPremium');
        if(!result){
            result=document.createElement('div');result.id='kkProfitResultPremium';result.className='kk-profit-result-grid';
            result.innerHTML='<div class="kk-profit-result-box"><span>Gross Profit</span><strong id="kkGrossProfitPremium">₱0.00</strong></div><div class="kk-profit-result-box"><span>Total OPEX</span><strong id="kkTotalOpexPremium">₱0.00</strong></div><div class="kk-net-profit-box"><span>NET PROFIT</span><strong id="kkNetProfitPremium">₱0.00</strong><div style="font-size:12px;font-weight:700;margin-top:3px">Net Margin: <span id="kkNetProfitPercent">0.00%</span></div></div>';
            card.appendChild(result);
        }
        const calc=document.getElementById('kkCalculatePremiumBtn');
        if(calc)calc.onclick=function(){calculateProfit();showMessage('profitMessage','Profit calculated successfully.','success');};
        const save=document.getElementById('kkSaveProfitBtn');
        if(save)save.onclick=function(){saveProfitRecord();};
    }

    window.saveProfitRecord=function(){
        const date=document.getElementById('profitDate')?.value;if(!date)return;
        const result=calculateProfit();
        const o=result.opex;
        const record={
            id:Date.now().toString(),date:date,
            foodSales:result.foodSales,otherSales:result.otherSales,totalSales:result.totalSales,
            foodCost:result.foodCost,otherCost:result.otherCost,totalCost:result.totalCost,grossProfit:result.grossProfit,
            expenses:{rent:result.dailyOpex.rent,gas:result.dailyOpex.gas,electricity:result.dailyOpex.electricity,water:result.dailyOpex.water,wifi:result.dailyOpex.wifi,labor:result.dailyOpex.labor,other:result.dailyOpex.other},
            totalExpenses:result.expenses,netProfit:result.netProfit,
            opex:{monthlyRent:o.monthlyRent,gas:o.gas,electricityMonthly:o.electricityMonthly,waterMonthly:o.waterMonthly,wifiMonthly:o.wifiMonthly,other:o.other,employees:o.employees}
        };
        const idx=profitRecords.findIndex(function(r){return r.date===date;});
        if(idx>=0){record.id=profitRecords[idx].id;profitRecords[idx]=record;}else profitRecords.push(record);
        saveAllData();
        if(typeof showMessage==='function')showMessage('profitMessage','Profit Calculator record saved successfully.','success');
        if(typeof updateDashboard==='function')updateDashboard();
    };

    function refreshPremiumProfit(){
        if(document.getElementById('profitScreen'))window.loadProfitCalculator();
    }
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refreshPremiumProfit,{once:true});
    else setTimeout(refreshPremiumProfit,0);
})();

/* =========================================================
   PROFIT CALCULATOR PREMIUM V3 — MOBILE REFINEMENT / BUG FIX
   - 4-column Sales + Cost of Goods summary
   - Reliable Add Employee handler
   - No manual Labor input
   - Rent starts from saved recurring setting only; no forced ₱3,000
   - Employee rows calculate labor immediately
   - OPEX daily/monthly logic preserved
========================================================= */
(function(){
    'use strict';

    const STYLE_ID='kk-profit-premium-v3';

    function n(v){return typeof numberValue==='function'?numberValue(v):(parseFloat(v)||0);}
    function m(v){return typeof money==='function'?money(v):'₱'+n(v).toLocaleString('en-PH',{minimumFractionDigits:2,maximumFractionDigits:2});}
    function today(){return typeof todayString==='function'?todayString():new Date().toISOString().slice(0,10);}

    function addStyles(){
        if(document.getElementById(STYLE_ID))return;
        const s=document.createElement('style');s.id=STYLE_ID;
        s.textContent=`
          .kk-profit-sales-cost-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:8px}
          .kk-profit-sales-cost-cell{min-width:0;border:1px solid #d9e2ec;border-radius:11px;background:#f8fafc;padding:10px 6px;text-align:center}
          .kk-profit-sales-cost-cell span{display:block;font-size:11px;font-weight:750;color:#64748b;line-height:1.2;min-height:27px}
          .kk-profit-sales-cost-cell strong{display:block;font-size:17px;font-weight:900;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
          .kk-profit-sales-cost-cell.total{background:#eef4f9}
          .kk-profit-section-title{font-size:18px;font-weight:900;color:#123b63;margin-top:2px}
          .kk-employee-actions{display:flex;justify-content:flex-end;margin-top:9px}
          .kk-labor-table{table-layout:fixed}
          .kk-labor-table th,.kk-labor-table td{overflow:hidden}
          .kk-labor-table input{font-size:16px!important}
          .kk-present-wrap input{width:23px!important;height:23px!important;cursor:pointer}
          .kk-labor-delete{cursor:pointer}
          .kk-employee-total-line{display:flex;justify-content:space-between;align-items:center;margin-top:10px;padding:10px 12px;border-radius:10px;background:#eef4f9;border:1px solid #cbd5e1}
          .kk-employee-total-line span{font-size:13px;font-weight:800;color:#475569}.kk-employee-total-line strong{font-size:18px;font-weight:900;color:#123b63}
          .kk-profit-message-spacer{min-height:0}
          @media(max-width:600px){
            .kk-profit-sales-cost-grid{gap:6px}
            .kk-profit-sales-cost-cell{padding:9px 3px;border-radius:9px}
            .kk-profit-sales-cost-cell span{font-size:10px;min-height:25px}
            .kk-profit-sales-cost-cell strong{font-size:14px}
          }
          @media(max-width:390px){
            .kk-profit-sales-cost-cell span{font-size:9px}
            .kk-profit-sales-cost-cell strong{font-size:13px}
          }
        `;
        document.head.appendChild(s);
    }

    function getSalesForDate(date){
        const sales=typeof getSavedDailySales==='function'?getSavedDailySales(date):null;
        return {
            foodSales:sales?n(sales.foodSales):0,
            otherSales:sales?n(sales.otherSales):0,
            foodCost:sales?n(sales.foodCost):0,
            otherCost:sales?n(sales.otherCost):0
        };
    }

    function renderSalesCostFourColumns(date){
        const sales=getSalesForDate(date);
        const totalSales=sales.foodSales+sales.otherSales;
        const totalCost=sales.foodCost+sales.otherCost;
        const gross=totalSales-totalCost;

        const oldSales=document.getElementById('profitFoodSales');
        if(oldSales){
            const oldCard=oldSales.closest('.card');
            if(oldCard){
                let grid=oldCard.querySelector('.kk-profit-sales-cost-grid');
                if(!grid){
                    grid=document.createElement('div');grid.className='kk-profit-sales-cost-grid';
                    grid.innerHTML=
                      '<div class="kk-profit-sales-cost-cell"><span>Cooked Food Sales</span><strong id="profitFoodSales">'+m(sales.foodSales)+'</strong></div>'+
                      '<div class="kk-profit-sales-cost-cell"><span>Other Item Sales</span><strong id="profitOtherSales">'+m(sales.otherSales)+'</strong></div>'+
                      '<div class="kk-profit-sales-cost-cell"><span>Cooked Food Cost</span><strong id="profitFoodCost">'+m(sales.foodCost)+'</strong></div>'+
                      '<div class="kk-profit-sales-cost-cell"><span>Other Item Cost</span><strong id="profitOtherCost">'+m(sales.otherCost)+'</strong></div>';
                    oldCard.innerHTML=
                      '<div class="section-title" style="font-size:18px">Sales & Cost of Goods</div>'+grid.outerHTML+
                      '<div class="profit-line"><span>Total Sales</span><strong id="profitTotalSales">'+m(totalSales)+'</strong></div>'+ 
                      '<div class="profit-line"><span>Total Cost of Goods</span><strong id="profitTotalCost">'+m(totalCost)+'</strong></div>'+ 
                      '<div class="profit-line"><span>Gross Profit</span><strong id="profitGrossProfit">'+m(gross)+'</strong></div>';
                }else{
                    const set=function(id,val){const e=document.getElementById(id);if(e)e.textContent=m(val);};
                    set('profitFoodSales',sales.foodSales);set('profitOtherSales',sales.otherSales);set('profitFoodCost',sales.foodCost);set('profitOtherCost',sales.otherCost);set('profitTotalSales',totalSales);set('profitTotalCost',totalCost);set('profitGrossProfit',gross);
                }
            }
        }
        return sales;
    }

    function previousRecord(date){
        if(!Array.isArray(profitRecords))return null;
        return profitRecords.filter(r=>r&&r.date&&r.date<date).sort((a,b)=>String(b.date).localeCompare(String(a.date)))[0]||null;
    }

    function defaultEmployees(){
        const stamp=Date.now();
        return [
          {id:'emp_'+stamp+'_1',name:'Employee 1',dailyRate:0,present:true},
          {id:'emp_'+stamp+'_2',name:'Employee 2',dailyRate:0,present:true}
        ];
    }
    function normalizeEmployees(list){
        if(!Array.isArray(list)||!list.length)return defaultEmployees();
        return list.map((e,i)=>({id:String(e.id||('emp_'+Date.now()+'_'+i)),name:String(e.name||('Employee '+(i+1))),dailyRate:n(e.dailyRate),present:e.present!==false}));
    }
    function legacyToOpex(record){
        const e=record&&record.expenses?record.expenses:{};
        return {monthlyRent:n(e.rent)*30,gas:n(e.gas),electricityMonthly:n(e.electricity)*30,waterMonthly:n(e.water)*30,wifiMonthly:n(e.wifi)*30,other:n(e.other),employees:e.labor>0?[{id:'legacy_labor',name:'Employee 1',dailyRate:n(e.labor),present:true}]:defaultEmployees()};
    }
    function getOpexForDate(date){
        const existing=profitRecords.find(r=>r.date===date);
        if(existing&&existing.opex)return {
          monthlyRent:n(existing.opex.monthlyRent),gas:n(existing.opex.gas),electricityMonthly:n(existing.opex.electricityMonthly),waterMonthly:n(existing.opex.waterMonthly),wifiMonthly:n(existing.opex.wifiMonthly),other:n(existing.opex.other),employees:normalizeEmployees(existing.opex.employees)
        };
        if(existing&&existing.expenses)return legacyToOpex(existing);
        const prev=previousRecord(date);
        if(prev&&prev.opex)return {monthlyRent:n(prev.opex.monthlyRent),gas:0,electricityMonthly:n(prev.opex.electricityMonthly),waterMonthly:n(prev.opex.waterMonthly),wifiMonthly:n(prev.opex.wifiMonthly),other:0,employees:normalizeEmployees(prev.opex.employees).map(e=>Object.assign({},e,{present:true}))};
        if(prev&&prev.expenses){const x=legacyToOpex(prev);x.gas=0;x.other=0;return x;}
        return {monthlyRent:0,gas:0,electricityMonthly:0,waterMonthly:0,wifiMonthly:0,other:0,employees:defaultEmployees()};
    }

    function getEmployeesFromUI(){
        return Array.from(document.querySelectorAll('#kkEmployeeTableWrap .kk-employee-row')).map((row,i)=>({
          id:String(row.dataset.id||('emp_'+Date.now()+'_'+i)),
          name:String(row.querySelector('.kk-employee-name')?.value||('Employee '+(i+1))).trim()||('Employee '+(i+1)),
          dailyRate:n(row.querySelector('.kk-employee-rate')?.value),
          present:!!row.querySelector('.kk-employee-present')?.checked
        }));
    }
    function laborTotal(list){return (list||[]).reduce((sum,e)=>sum+(e.present?n(e.dailyRate):0),0);}

    function opexInput(icon,title,caption,id,value,dailyText){
        return '<div class="kk-opex-item"><div class="kk-opex-title">'+icon+' '+title+'</div><input id="'+id+'" type="number" min="0" step="0.01" inputmode="decimal" value="'+n(value)+'" aria-label="'+title+' '+caption+'"><div class="kk-opex-caption">'+caption+'</div><div class="kk-opex-daily" id="'+id+'Daily">'+dailyText+'</div></div>';
    }

    function renderEmployees(employees){
        const wrap=document.getElementById('kkEmployeeTableWrap');if(!wrap)return;
        employees=Array.isArray(employees)?employees:[];
        let html='';
        if(employees.length){
          html='<table class="kk-labor-table"><thead><tr><th style="width:40%">Employee</th><th style="width:28%">Daily Rate</th><th style="width:18%;text-align:center">Present</th><th style="width:14%"></th></tr></thead><tbody>';
          employees.forEach((e,i)=>{
            html+='<tr class="kk-employee-row" data-id="'+escapeHtml(e.id)+'">'+
              '<td><input class="kk-employee-name" type="text" value="'+escapeHtml(e.name)+'" placeholder="Employee '+(i+1)+'"></td>'+
              '<td><input class="kk-employee-rate" type="number" min="0" step="0.01" inputmode="decimal" value="'+n(e.dailyRate)+'" placeholder="₱0"></td>'+
              '<td><div class="kk-present-wrap"><input class="kk-employee-present" type="checkbox" '+(e.present?'checked':'')+'></div></td>'+
              '<td><button type="button" class="btn btn-danger btn-small kk-labor-delete" aria-label="Delete employee">×</button></td></tr>';
          });
          html+='</tbody></table>';
        }else html='<div class="kk-labor-empty">No employees added.</div>';
        wrap.innerHTML=html;

        wrap.querySelectorAll('.kk-employee-row').forEach(row=>{
          row.querySelectorAll('input').forEach(el=>{
            el.addEventListener('input',function(){window.calculateProfit();});
            el.addEventListener('change',function(){window.calculateProfit();});
          });
          const del=row.querySelector('.kk-labor-delete');
          if(del)del.onclick=function(){
            const remove=function(){
              const current=getEmployeesFromUI().filter(e=>e.id!==row.dataset.id);
              renderEmployees(current);window.calculateProfit();
            };
            if(typeof window.kkPremiumConfirmDelete==='function')window.kkPremiumConfirmDelete('Delete this employee?',remove);else remove();
          };
        });
    }

    function buildOpex(opex){
        addStyles();
        const profit=document.getElementById('profitScreen');if(!profit)return;
        let card=document.getElementById('kkProfitOpexCard');
        if(!card){card=document.createElement('div');profit.appendChild(card);}
        card.className='card kk-opex-card';card.id='kkProfitOpexCard';
        const emp=normalizeEmployees(opex.employees);
        card.innerHTML='<div class="section-title" style="font-size:19px">Operating Expenses</div>'+ 
          '<div class="small-text" style="margin-bottom:10px">Monthly expenses are converted to a daily cost. Gas and Other are actual daily amounts.</div>'+ 
          '<div class="kk-opex-grid">'+
          opexInput('🏠','Rent','Monthly','kkMonthlyRent',opex.monthlyRent,'Daily: '+m(n(opex.monthlyRent)/30))+ 
          opexInput('🔥','Gas / LPG','Actual','kkGasActual',opex.gas,'Daily: '+m(opex.gas))+ 
          opexInput('⚡','Electricity','Previous Bill','kkElectricityMonthly',opex.electricityMonthly,'Daily: '+m(n(opex.electricityMonthly)/30))+ 
          opexInput('💧','Water','Previous Bill','kkWaterMonthly',opex.waterMonthly,'Daily: '+m(n(opex.waterMonthly)/30))+ 
          opexInput('📶','WiFi','Monthly','kkWifiMonthly',opex.wifiMonthly,'Daily: '+m(n(opex.wifiMonthly)/30))+ 
          opexInput('📦','Other','Actual','kkOtherDaily',opex.other,'Daily: '+m(opex.other))+ 
          '<div class="kk-opex-item"><div class="kk-opex-title">👷 Labor</div><div id="kkLaborTotalValue" class="kk-opex-labor-value">'+m(laborTotal(emp))+'</div><div class="kk-opex-caption">Auto from employees</div></div>'+ 
          '<div class="kk-opex-total"><span>Total OPEX</span><strong id="kkOpexTotal">₱0.00</strong></div></div>'+ 
          '<div class="button-row" style="margin-top:10px"><button type="button" class="btn btn-primary" id="kkCalculatePremiumBtn">Calculate</button><button type="button" class="btn btn-success" id="kkSaveProfitBtn">Save Profit Record</button></div>'+ 
          '<div id="profitMessage" class="message"></div>';

        let labor=document.getElementById('kkLaborCard');
        if(!labor){labor=document.createElement('div');labor.id='kkLaborCard';card.insertAdjacentElement('afterend',labor);}
        labor.className='kk-labor-card';
        labor.innerHTML='<div class="kk-labor-header"><div class="kk-labor-title">👷 Employees / Labor</div><button type="button" class="btn btn-primary btn-small" id="kkAddEmployeeBtn">＋ Add Employee</button></div><div id="kkEmployeeTableWrap"></div><div class="kk-employee-total-line"><span>Total Labor Cost</span><strong id="kkEmployeeTotalValue">'+m(laborTotal(emp))+'</strong></div>';
        renderEmployees(emp);

        ['kkMonthlyRent','kkGasActual','kkElectricityMonthly','kkWaterMonthly','kkWifiMonthly','kkOtherDaily'].forEach(id=>{
          const el=document.getElementById(id);if(el)el.addEventListener('input',function(){window.calculateProfit();});
        });

        const add=document.getElementById('kkAddEmployeeBtn');
        if(add){
          add.onclick=function(e){
            e.preventDefault();
            const current=getEmployeesFromUI();
            const index=current.length+1;
            current.push({id:'emp_'+Date.now()+'_'+index,name:'Employee '+index,dailyRate:0,present:true});
            renderEmployees(current);
            window.calculateProfit();
            setTimeout(function(){const rows=document.querySelectorAll('#kkEmployeeTableWrap .kk-employee-row');const last=rows[rows.length-1];if(last){last.querySelector('.kk-employee-name')?.focus();}},30);
          };
        }
        if(typeof syncHiddenLegacyInputs==='function')syncHiddenLegacyInputs();
    }

    function readOpex(){
        return {
          monthlyRent:n(document.getElementById('kkMonthlyRent')?.value),gas:n(document.getElementById('kkGasActual')?.value),
          electricityMonthly:n(document.getElementById('kkElectricityMonthly')?.value),waterMonthly:n(document.getElementById('kkWaterMonthly')?.value),
          wifiMonthly:n(document.getElementById('kkWifiMonthly')?.value),other:n(document.getElementById('kkOtherDaily')?.value),employees:getEmployeesFromUI()
        };
    }

    function updateDaily(opex){
        const values={kkMonthlyRent:n(opex.monthlyRent)/30,kkGasActual:n(opex.gas),kkElectricityMonthly:n(opex.electricityMonthly)/30,kkWaterMonthly:n(opex.waterMonthly)/30,kkWifiMonthly:n(opex.wifiMonthly)/30};
        Object.keys(values).forEach(id=>{const el=document.getElementById(id+'Daily');if(el)el.textContent='Daily: '+m(values[id]);});
        const labor=laborTotal(opex.employees);
        const lv=document.getElementById('kkLaborTotalValue');if(lv)lv.textContent=m(labor);
        const ev=document.getElementById('kkEmployeeTotalValue');if(ev)ev.textContent=m(labor);
        const total=Object.values(values).reduce((a,b)=>a+b,0)+labor+n(opex.other);
        const ot=document.getElementById('kkOpexTotal');if(ot)ot.textContent=m(total);
        return {rent:values.kkMonthlyRent,gas:values.kkGasActual,electricity:values.kkElectricityMonthly,water:values.kkWaterMonthly,wifi:values.kkWifiMonthly,labor:labor,other:n(opex.other),total:total};
    }

    window.calculateProfit=function(){
        const date=document.getElementById('profitDate')?.value||today();
        const sales=getSalesForDate(date);
        const totalSales=sales.foodSales+sales.otherSales,totalCost=sales.foodCost+sales.otherCost,gross=totalSales-totalCost;
        const opex=readOpex(),daily=updateDaily(opex),net=gross-daily.total,margin=totalSales?net/totalSales*100:0;
        const set=(id,val)=>{const e=document.getElementById(id);if(e)e.textContent=m(val);};
        set('profitFoodSales',sales.foodSales);set('profitOtherSales',sales.otherSales);set('profitFoodCost',sales.foodCost);set('profitOtherCost',sales.otherCost);set('profitTotalSales',totalSales);set('profitTotalCost',totalCost);set('profitGrossProfit',gross);set('profitExpenses',daily.total);set('profitNetProfit',net);
        const np=document.getElementById('kkNetProfitPremium');if(np){np.textContent=m(net);np.classList.toggle('kk-profit-positive',net>0);np.classList.toggle('kk-profit-negative',net<0);}
        const gp=document.getElementById('kkGrossProfitPremium');if(gp)gp.textContent=m(gross);
        const tp=document.getElementById('kkTotalOpexPremium');if(tp)tp.textContent=m(daily.total);
        const pct=document.getElementById('kkNetProfitPercent');if(pct)pct.textContent=margin.toFixed(2)+'%';
        return {foodSales:sales.foodSales,otherSales:sales.otherSales,totalSales,foodCost:sales.foodCost,otherCost:sales.otherCost,totalCost,grossProfit:gross,expenses:daily.total,netProfit:net,netProfitPercent:margin,opex,dailyOpex:daily};
    };

    window.loadProfitCalculator=function(){
        const dateInput=document.getElementById('profitDate');if(!dateInput)return;
        if(!dateInput.value)dateInput.value=today();
        const date=dateInput.value;
        renderSalesCostFourColumns(date);
        buildOpex(getOpexForDate(date));
        if(typeof ensureProfitResultUI==='function')ensureProfitResultUI();
        window.calculateProfit();
    };
    window.loadProfitForDate=window.loadProfitCalculator;

    window.saveProfitRecord=function(){
        const date=document.getElementById('profitDate')?.value;if(!date)return;
        const r=window.calculateProfit(),o=r.opex;
        const record={id:Date.now().toString(),date:date,foodSales:r.foodSales,otherSales:r.otherSales,totalSales:r.totalSales,foodCost:r.foodCost,otherCost:r.otherCost,totalCost:r.totalCost,grossProfit:r.grossProfit,expenses:{rent:r.dailyOpex.rent,gas:r.dailyOpex.gas,electricity:r.dailyOpex.electricity,water:r.dailyOpex.water,wifi:r.dailyOpex.wifi,labor:r.dailyOpex.labor,other:r.dailyOpex.other},totalExpenses:r.expenses,netProfit:r.netProfit,opex:{monthlyRent:o.monthlyRent,gas:o.gas,electricityMonthly:o.electricityMonthly,waterMonthly:o.waterMonthly,wifiMonthly:o.wifiMonthly,other:o.other,employees:o.employees}};
        const idx=profitRecords.findIndex(r=>r.date===date);if(idx>=0){record.id=profitRecords[idx].id;profitRecords[idx]=record;}else profitRecords.push(record);
        saveAllData();
        if(typeof showMessage==='function')showMessage('profitMessage','Profit Calculator record saved successfully.','success');
        if(typeof updateDashboard==='function')updateDashboard();
    };

    function refresh(){addStyles();if(document.getElementById('profitScreen'))setTimeout(()=>window.loadProfitCalculator(),0);}
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refresh,{once:true});else refresh();
})();

/* ================================================================
   CORRECTED DAILY PROFIT / OPEX OVERRIDE
   This override replaces only the Profit Calculator screen.
   Login, Ingredients, Other Items, Recipes and Today's Menu & Sales
   remain untouched.
   ================================================================ */
(function(){
    'use strict';

    const STYLE_ID='kk-daily-profit-corrected-final';

    function n(v){
        if(typeof numberValue==='function') return numberValue(v);
        const x=parseFloat(v); return Number.isFinite(x)?x:0;
    }
    function money(v){
        if(typeof window.money==='function') return window.money(v);
        return '₱'+n(v).toLocaleString('en-PH',{minimumFractionDigits:2,maximumFractionDigits:2});
    }
    function today(){
        return typeof todayString==='function'?todayString():new Date().toISOString().slice(0,10);
    }

    function addStyles(){
        if(document.getElementById(STYLE_ID))return;
        const s=document.createElement('style');
        s.id=STYLE_ID;
        s.textContent=`
        #profitScreen .kkdp-wrap{width:100%;box-sizing:border-box}
        #profitScreen .kkdp-date-row{display:flex;align-items:center;gap:8px;margin-bottom:12px}
        #profitScreen .kkdp-date-row label{font-weight:800;font-size:14px}
        #profitScreen .kkdp-date-row input{flex:1;min-width:0;min-height:44px}

        #profitScreen .kkdp-grid3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-bottom:10px}
        #profitScreen .kkdp-card{min-width:0;box-sizing:border-box;border:1px solid #d8e1ea;border-radius:12px;background:#fff;padding:10px 6px;text-align:center;overflow:hidden}
        #profitScreen .kkdp-card .kkdp-label{display:block;font-size:11px;font-weight:800;line-height:1.2;color:#526579;min-height:28px}
        #profitScreen .kkdp-card .kkdp-value{display:block;font-size:18px;font-weight:950;line-height:1.2;margin-top:5px;word-break:break-word}
        #profitScreen .kkdp-card .kkdp-sub{display:block;font-size:9px;color:#718096;margin-top:4px;line-height:1.15}
        #profitScreen .kkdp-card.kkdp-profit-positive .kkdp-value{color:#15803d}
        #profitScreen .kkdp-card.kkdp-profit-negative .kkdp-value{color:#c62828}

        #profitScreen .kkdp-sales{margin-bottom:12px}
        #profitScreen .kkdp-sales .kkdp-card{background:#f8fbfe}
        #profitScreen .kkdp-capital{margin-bottom:12px}
        #profitScreen .kkdp-profit{margin-bottom:14px}
        #profitScreen .kkdp-profit .kkdp-card{background:#f8fbfe}

        #profitScreen .kkdp-section-title{font-size:18px;font-weight:900;color:#123b63;margin:14px 0 8px}
        #profitScreen .kkdp-opex-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px}
        #profitScreen .kkdp-opex-card{min-width:0;border:1px solid #d8e1ea;border-radius:11px;background:#fff;padding:8px 4px;text-align:center;box-sizing:border-box;overflow:hidden}
        #profitScreen .kkdp-opex-card .kkdp-opex-name{font-size:11px;font-weight:900;line-height:1.15;min-height:26px;display:flex;align-items:center;justify-content:center}
        #profitScreen .kkdp-opex-card .kkdp-opex-type{font-size:8px;color:#718096;margin:2px 0 4px;min-height:10px}
        #profitScreen .kkdp-opex-card input{width:100%;box-sizing:border-box;min-height:42px;border:1px solid #cbd5e1;border-radius:8px;text-align:center;font-size:14px;font-weight:800;padding:5px 2px}
        #profitScreen .kkdp-opex-card input[readonly]{background:#f8fafc}
        #profitScreen .kkdp-opex-daily{font-size:9px;color:#526579;font-weight:700;margin-top:4px;min-height:12px}
        #profitScreen .kkdp-opex-actions{margin-top:5px;display:flex;justify-content:center;gap:3px}
        #profitScreen .kkdp-opex-actions button{min-height:30px;padding:3px 7px!important;font-size:10px!important}
        #profitScreen .kkdp-total-card{display:flex;flex-direction:column;justify-content:center}
        #profitScreen .kkdp-total-card .kkdp-total-value{font-size:17px;font-weight:950;color:#123b63;margin-top:5px}

        #profitScreen .kkdp-employees{margin-top:12px;border:1px solid #d8e1ea;border-radius:12px;background:#fff;padding:10px}
        #profitScreen .kkdp-employee-header{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px}
        #profitScreen .kkdp-employee-title{font-size:16px;font-weight:900;color:#123b63}
        #profitScreen .kkdp-employee-table{width:100%;border-collapse:collapse;table-layout:fixed}
        #profitScreen .kkdp-employee-table th{font-size:10px;color:#64748b;text-align:left;padding:4px}
        #profitScreen .kkdp-employee-table td{padding:3px;vertical-align:middle}
        #profitScreen .kkdp-employee-table input[type=text],#profitScreen .kkdp-employee-table input[type=number]{width:100%;box-sizing:border-box;min-height:42px;border:1px solid #cbd5e1;border-radius:8px;padding:6px;font-size:14px}
        #profitScreen .kkdp-employee-table input[type=number]{text-align:center;font-weight:800}
        #profitScreen .kkdp-present{text-align:center}
        #profitScreen .kkdp-present input{width:20px;height:20px}
        #profitScreen .kkdp-delete-employee{width:40px;min-width:40px;height:40px;padding:0!important}
        #profitScreen .kkdp-labor-total{display:flex;justify-content:space-between;align-items:center;margin-top:8px;padding:9px 11px;border-radius:9px;background:#f1f6fa;border:1px solid #d8e1ea;font-weight:900}

        #profitScreen .kkdp-buttons{display:flex;gap:8px;margin-top:12px}
        #profitScreen .kkdp-buttons button{flex:1;min-height:46px}
        #profitScreen .kkdp-message{min-height:22px;margin-top:8px}
        #profitScreen .kkdp-note{font-size:11px;color:#64748b;margin:5px 0 8px;line-height:1.35}

        @media(max-width:600px){
          #profitScreen .kkdp-grid3{gap:6px}
          #profitScreen .kkdp-card{padding:9px 3px;border-radius:10px}
          #profitScreen .kkdp-card .kkdp-label{font-size:10px}
          #profitScreen .kkdp-card .kkdp-value{font-size:15px}
          #profitScreen .kkdp-opex-grid{gap:5px}
          #profitScreen .kkdp-opex-card{padding:7px 3px;border-radius:9px}
          #profitScreen .kkdp-opex-card .kkdp-opex-name{font-size:10px}
          #profitScreen .kkdp-opex-card input{font-size:13px;min-height:42px}
          #profitScreen .kkdp-opex-actions button{font-size:9px!important;padding:3px 5px!important}
          #profitScreen .kkdp-employee-table th{font-size:9px}
          #profitScreen .kkdp-employee-table td{padding:2px}
          #profitScreen .kkdp-employee-table input[type=text],#profitScreen .kkdp-employee-table input[type=number]{font-size:13px;min-height:42px}
        }
        @media(max-width:390px){
          #profitScreen .kkdp-card .kkdp-label{font-size:9px}
          #profitScreen .kkdp-card .kkdp-value{font-size:14px}
          #profitScreen .kkdp-opex-card .kkdp-opex-name{font-size:9px}
          #profitScreen .kkdp-opex-card input{font-size:12px}
          #profitScreen .kkdp-employee-title{font-size:14px}
        }
        `;
        document.head.appendChild(s);
    }

    function getDate(){return document.getElementById('kkdpProfitDate')?.value||today();}

    function getSalesRecord(date){
        if(typeof stage4TodayRecord==='function')return stage4TodayRecord(date);
        return Array.isArray(dailySalesRecords)?dailySalesRecords.find(r=>String(r.date)===String(date)):null;
    }

    function getFoodCostAndSales(date){
        const record=getSalesRecord(date);
        let sales=0,cost=0,count=0;
        if(!record)return {sales:0,cost:0,count:0};

        const foods=Array.isArray(record.foodItems)?record.foodItems:[];
        foods.forEach(function(item){
            const qty=n(item.servingsSold);
            const selling=n(item.sellingPrice);
            sales+=selling*qty;
            /* AGREED RULE: recipe cost is counted ONCE, not qty times. */
            if(qty>0){
                let recipe=null;
                if(Array.isArray(savedRecipes)){
                    recipe=savedRecipes.find(r=>String(r.id)===String(item.recipeId));
                }
                const recipeCost=recipe?n(recipe.totalCost):n(item.recipeCost||item.foodCost||0);
                cost+=recipeCost;
            }
            count+=qty;
        });
        return {sales:sales,cost:cost,count:count};
    }

    function getOtherCostAndSales(date){
        const record=getSalesRecord(date);
        let sales=0,cost=0,count=0;
        if(!record)return {sales:0,cost:0,count:0};
        const items=Array.isArray(record.otherItems)?record.otherItems:[];
        items.forEach(function(item){
            const qty=n(item.quantitySold);
            sales+=n(item.sellingPrice)*qty;
            cost+=n(item.unitCost)*qty;
            count+=qty;
        });
        return {sales:sales,cost:cost,count:count};
    }

    function previousProfitRecord(date){
        return (Array.isArray(profitRecords)?profitRecords:[])
          .filter(r=>r&&r.date&&String(r.date)<String(date))
          .sort((a,b)=>String(b.date).localeCompare(String(a.date)))[0]||null;
    }

    function normalizeEmployees(list){
        if(!Array.isArray(list))return [];
        return list.map(function(e,i){return {
            id:String(e.id||('emp_'+Date.now()+'_'+i)),
            name:String(e.name||('Employee '+(i+1))),
            dailyRate:n(e.dailyRate),
            present:e.present!==false
        };});
    }

    function defaultOpex(){
        return {monthlyRent:0,electricityMonthly:0,waterMonthly:0,wifiMonthly:0,gas:0,other:0,employees:[]};
    }

    function getOpexSnapshot(date){
        const exact=(Array.isArray(profitRecords)?profitRecords:[]).find(r=>String(r.date)===String(date));
        if(exact&&exact.opex){
            return {
                monthlyRent:n(exact.opex.monthlyRent),
                electricityMonthly:n(exact.opex.electricityMonthly),
                waterMonthly:n(exact.opex.waterMonthly),
                wifiMonthly:n(exact.opex.wifiMonthly),
                gas:n(exact.opex.gas),other:n(exact.opex.other),
                employees:normalizeEmployees(exact.opex.employees)
            };
        }
        const prev=previousProfitRecord(date);
        if(prev&&prev.opex){
            return {
                monthlyRent:n(prev.opex.monthlyRent),
                electricityMonthly:n(prev.opex.electricityMonthly),
                waterMonthly:n(prev.opex.waterMonthly),
                wifiMonthly:n(prev.opex.wifiMonthly),
                gas:0,other:0,
                employees:normalizeEmployees(prev.opex.employees).map(e=>Object.assign({},e,{present:true}))
            };
        }
        return defaultOpex();
    }

    function laborTotal(employees){
        return (employees||[]).reduce((sum,e)=>sum+(e.present?n(e.dailyRate):0),0);
    }

    function monthlyDaily(v){return n(v)/30;}

    function currentEmployeesFromUI(){
        return Array.from(document.querySelectorAll('#kkdpEmployeeBody tr[data-id]')).map(function(row,i){
            return {
                id:String(row.dataset.id),
                name:String(row.querySelector('.kkdp-emp-name')?.value||('Employee '+(i+1))).trim()||('Employee '+(i+1)),
                dailyRate:n(row.querySelector('.kkdp-emp-rate')?.value),
                present:!!row.querySelector('.kkdp-emp-present')?.checked
            };
        });
    }

    function saveSnapshot(date, opex, result, message){
        const record={
            id:Date.now().toString(),date:date,
            foodSales:result.foodSales,otherSales:result.otherSales,totalSales:result.totalSales,
            foodCost:result.foodCost,otherCost:result.otherCost,totalCost:result.totalCapitalCost,
            grossProfit:result.totalSales-result.totalCapitalCost,
            expenses:{rent:result.dailyOpex.rent,gas:result.dailyOpex.gas,electricity:result.dailyOpex.electricity,water:result.dailyOpex.water,wifi:result.dailyOpex.wifi,labor:result.dailyOpex.labor,other:result.dailyOpex.other},
            totalExpenses:result.dailyOpex.total,netProfit:result.netProfit,
            opex:{
                monthlyRent:n(opex.monthlyRent),gas:n(opex.gas),
                electricityMonthly:n(opex.electricityMonthly),waterMonthly:n(opex.waterMonthly),
                wifiMonthly:n(opex.wifiMonthly),other:n(opex.other),
                employees:normalizeEmployees(opex.employees)
            }
        };
        const idx=(Array.isArray(profitRecords)?profitRecords:[]).findIndex(r=>String(r.date)===String(date));
        if(idx>=0){record.id=profitRecords[idx].id;profitRecords[idx]=record;}else profitRecords.push(record);
        if(typeof saveAllData==='function')saveAllData();
        if(message){
            const box=document.getElementById('kkdpMessage');
            if(box)box.innerHTML='<div class="message success">'+message+'</div>';
        }
    }

    function calculate(){
        const date=getDate();
        const food=getFoodCostAndSales(date);
        const other=getOtherCostAndSales(date);
        const opex=readOpexUI();
        const daily={
            rent:monthlyDaily(opex.monthlyRent),
            electricity:monthlyDaily(opex.electricityMonthly),
            water:monthlyDaily(opex.waterMonthly),
            wifi:monthlyDaily(opex.wifiMonthly),
            gas:n(opex.gas),
            labor:laborTotal(opex.employees),
            other:n(opex.other)
        };
        daily.total=daily.rent+daily.electricity+daily.water+daily.wifi+daily.gas+daily.labor+daily.other;
        const totalSales=food.sales+other.sales;
        const totalCapitalCost=food.cost+other.cost;
        const netProfit=totalSales-totalCapitalCost-daily.total;
        const result={foodSales:food.sales,otherSales:other.sales,totalSales,foodCost:food.cost,otherCost:other.cost,totalCapitalCost,foodCount:food.count,otherCount:other.count,netProfit,dailyOpex:daily,opex:opex};

        setText('kkdpFoodSales',money(food.sales));
        setText('kkdpOtherSales',money(other.sales));
        setText('kkdpOpex',money(daily.total));
        setText('kkdpFoodCapital',money(food.cost));
        setText('kkdpOtherCapital',money(other.cost));
        setText('kkdpTotalCapital',money(totalCapitalCost));
        setText('kkdpFoodCount',String(food.count));
        setText('kkdpOtherCount',String(other.count));
        setText('kkdpProfit',money(netProfit));
        const profitCard=document.getElementById('kkdpProfitCard');
        if(profitCard){profitCard.classList.toggle('kkdp-profit-positive',netProfit>0);profitCard.classList.toggle('kkdp-profit-negative',netProfit<0);}
        setText('kkdpRentDaily', 'Daily: '+money(daily.rent));
        setText('kkdpElectricityDaily','Daily: '+money(daily.electricity));
        setText('kkdpWaterDaily','Daily: '+money(daily.water));
        setText('kkdpWifiDaily','Daily: '+money(daily.wifi));
        setText('kkdpGasDaily','Daily: '+money(daily.gas));
        setText('kkdpLaborDaily','Daily: '+money(daily.labor));
        setText('kkdpOtherDaily','Daily: '+money(daily.other));
        setText('kkdpOpexTotal',money(daily.total));
        return result;
    }

    function setText(id,value){const e=document.getElementById(id);if(e)e.textContent=value;}

    function readOpexUI(){
        return {
            monthlyRent:n(document.getElementById('kkdpRent')?.value),
            electricityMonthly:n(document.getElementById('kkdpElectricity')?.value),
            waterMonthly:n(document.getElementById('kkdpWater')?.value),
            wifiMonthly:n(document.getElementById('kkdpWifi')?.value),
            gas:n(document.getElementById('kkdpGas')?.value),
            other:n(document.getElementById('kkdpOther')?.value),
            employees:currentEmployeesFromUI()
        };
    }

    function opexCard(id,name,type,value,dailyId,editable){
        return '<div class="kkdp-opex-card">'+
          '<div class="kkdp-opex-name">'+name+'</div>'+
          '<div class="kkdp-opex-type">'+type+'</div>'+
          '<input id="'+id+'" type="number" min="0" step="0.01" inputmode="decimal" value="'+n(value)+'" '+(editable?'':'readonly')+'>'+
          '<div class="kkdp-opex-daily" id="'+dailyId+'">Daily: ₱0.00</div>'+
          (editable?'<div class="kkdp-opex-actions"><button type="button" class="btn btn-secondary btn-small" data-edit="'+id+'">Edit</button><button type="button" class="btn btn-success btn-small" data-update="'+id+'">Update</button></div>':'')+
        '</div>';
    }

    function renderEmployees(employees){
        const body=document.getElementById('kkdpEmployeeBody');if(!body)return;
        const list=normalizeEmployees(employees);
        body.innerHTML='';
        list.forEach(function(e,i){
            const tr=document.createElement('tr');
            tr.dataset.id=e.id;
            tr.innerHTML='<td><input class="kkdp-emp-name" type="text" value="'+escapeAttr(e.name)+'" placeholder="Employee '+(i+1)+'"></td>'+
              '<td><input class="kkdp-emp-rate" type="number" min="0" step="0.01" inputmode="decimal" value="'+n(e.dailyRate)+'"></td>'+
              '<td class="kkdp-present"><input class="kkdp-emp-present" type="checkbox" '+(e.present?'checked':'')+'></td>'+
              '<td><button type="button" class="btn btn-danger btn-small kkdp-delete-employee">×</button></td>';
            body.appendChild(tr);
            tr.querySelectorAll('input').forEach(input=>{
                input.addEventListener('input',calculate);
                input.addEventListener('change',calculate);
            });
            tr.querySelector('.kkdp-delete-employee').onclick=function(){
                const remove=()=>{tr.remove();calculate();};
                if(typeof window.kkPremiumConfirmDelete==='function')window.kkPremiumConfirmDelete('Delete this employee?',remove);else remove();
            };
        });
        setText('kkdpLaborTotal',money(laborTotal(currentEmployeesFromUI())));
    }

    function escapeAttr(v){
        return String(v||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    function build(date){
        addStyles();
        const profit=document.getElementById('profitScreen');if(!profit)return;
        const opex=getOpexSnapshot(date);
        profit.innerHTML=''+
          '<div class="kkdp-wrap">'+
            '<div class="kkdp-date-row"><label for="kkdpProfitDate">Date</label><input id="kkdpProfitDate" type="date" value="'+date+'"></div>'+ 
            '<div class="kkdp-section-title">Sales & Operating Expenses</div>'+ 
            '<div class="kkdp-grid3 kkdp-sales">'+
              '<div class="kkdp-card"><span class="kkdp-label">Cooked Food Sales</span><strong class="kkdp-value" id="kkdpFoodSales">₱0.00</strong></div>'+
              '<div class="kkdp-card"><span class="kkdp-label">Other Items Sold</span><strong class="kkdp-value" id="kkdpOtherSales">₱0.00</strong></div>'+
              '<div class="kkdp-card"><span class="kkdp-label">OPEX</span><strong class="kkdp-value" id="kkdpOpex">₱0.00</strong></div>'+
            '</div>'+ 
            '<div class="kkdp-section-title">Daily Cost & Profit</div>'+ 
            '<div class="kkdp-grid3 kkdp-capital">'+
              '<div class="kkdp-card"><span class="kkdp-label">Capital Cost</span><strong class="kkdp-value" id="kkdpTotalCapital">₱0.00</strong><span class="kkdp-sub">Food + Other Item</span></div>'+
              '<div class="kkdp-card"><span class="kkdp-label">Number of Sales</span><strong class="kkdp-value" id="kkdpSalesCount">0</strong><span class="kkdp-sub"><span id="kkdpFoodCount">0</span> Food · <span id="kkdpOtherCount">0</span> Other</span></div>'+
              '<div class="kkdp-card" id="kkdpProfitCard"><span class="kkdp-label">Profit</span><strong class="kkdp-value" id="kkdpProfit">₱0.00</strong><span class="kkdp-sub">Sales − Capital Cost − OPEX</span></div>'+
            '</div>'+ 
            '<div class="kkdp-grid3" style="margin-top:-5px;margin-bottom:14px">'+
              '<div class="kkdp-card"><span class="kkdp-label">Food Capital Cost</span><strong class="kkdp-value" id="kkdpFoodCapital">₱0.00</strong><span class="kkdp-sub">Recipe cost once</span></div>'+ 
              '<div class="kkdp-card"><span class="kkdp-label">Other Item Capital Cost</span><strong class="kkdp-value" id="kkdpOtherCapital">₱0.00</strong><span class="kkdp-sub">Unit cost × quantity</span></div>'+ 
              '<div class="kkdp-card"><span class="kkdp-label">Sales Count</span><strong class="kkdp-value" id="kkdpSalesCount2">0</strong><span class="kkdp-sub">Food + Other</span></div>'+ 
            '</div>'+ 
            '<div class="kkdp-section-title">OPEX</div>'+ 
            '<div class="kkdp-note">Monthly values are divided by 30 and carried forward until changed. Gas/LPG and Other are daily values. Historical saved dates keep their own values.</div>'+ 
            '<div class="kkdp-opex-grid">'+
              opexCard('kkdpRent','Rent','Monthly',opex.monthlyRent,'kkdpRentDaily',true)+
              opexCard('kkdpElectricity','Electricity','Monthly Bill',opex.electricityMonthly,'kkdpElectricityDaily',true)+
              opexCard('kkdpWater','Water','Monthly Bill',opex.waterMonthly,'kkdpWaterDaily',true)+
              opexCard('kkdpWifi','WiFi','Monthly',opex.wifiMonthly,'kkdpWifiDaily',true)+
              opexCard('kkdpGas','Gas / LPG','Daily',opex.gas,'kkdpGasDaily',false)+
              opexCard('kkdpLabor','Labor','Auto',laborTotal(opex.employees),'kkdpLaborDaily',false)+
              opexCard('kkdpOther','Other','Daily',opex.other,'kkdpOtherDaily',false)+
              '<div class="kkdp-opex-card kkdp-total-card"><div class="kkdp-opex-name">Total OPEX</div><div class="kkdp-opex-type">Daily</div><div class="kkdp-total-value" id="kkdpOpexTotal">₱0.00</div></div>'+ 
            '</div>'+ 
            '<div class="kkdp-employees">'+
              '<div class="kkdp-employee-header"><div class="kkdp-employee-title">Employees / Labor</div><button type="button" class="btn btn-primary btn-small" id="kkdpAddEmployee">＋ Add Employee</button></div>'+ 
              '<table class="kkdp-employee-table"><thead><tr><th style="width:38%">Employee</th><th style="width:27%">Daily Rate</th><th style="width:18%;text-align:center">Present</th><th style="width:17%"></th></tr></thead><tbody id="kkdpEmployeeBody"></tbody></table>'+ 
              '<div class="kkdp-labor-total"><span>Total Labor Cost</span><strong id="kkdpLaborTotal">₱0.00</strong></div>'+ 
            '</div>'+ 
            '<div class="kkdp-buttons"><button type="button" class="btn btn-primary" id="kkdpCalculate">Calculate</button><button type="button" class="btn btn-success" id="kkdpSave">Save Profit Record</button></div>'+ 
            '<div id="kkdpMessage" class="kkdp-message"></div>'+ 
          '</div>';

        renderEmployees(opex.employees);

        const dateInput=document.getElementById('kkdpProfitDate');
        dateInput.addEventListener('change',function(){build(this.value||today());});
        document.getElementById('kkdpCalculate').onclick=function(){calculate();};
        document.getElementById('kkdpSave').onclick=function(){
            const result=calculate();
            const current=readOpexUI();
            saveSnapshot(dateInput.value||today(),current,result,'✓ Profit record saved successfully.');
        };
        document.getElementById('kkdpAddEmployee').onclick=function(){
            const current=currentEmployeesFromUI();
            const i=current.length+1;
            current.push({id:'emp_'+Date.now()+'_'+i,name:'Employee '+i,dailyRate:0,present:true});
            renderEmployees(current);calculate();
        };

        document.querySelectorAll('[data-edit]').forEach(function(btn){
            btn.onclick=function(){
                const id=btn.dataset.edit;
                const input=document.getElementById(id);if(!input)return;
                input.readOnly=false;input.focus();
            };
        });
        document.querySelectorAll('[data-update]').forEach(function(btn){
            btn.onclick=function(){
                const id=btn.dataset.update;
                const input=document.getElementById(id);if(!input)return;
                input.readOnly=true;
                const result=calculate();
                const current=readOpexUI();
                saveSnapshot(date,current,result,'✓ OPEX updated successfully.');
            };
        });

        ['kkdpRent','kkdpElectricity','kkdpWater','kkdpWifi','kkdpGas','kkdpOther'].forEach(function(id){
            const el=document.getElementById(id);
            if(el)el.addEventListener('input',calculate);
        });
        calculate();
    }

    window.calculateProfit=function(){
        return calculate();
    };

    window.saveProfitRecord=function(){
        const date=getDate();
        const result=calculate();
        const current=readOpexUI();
        saveSnapshot(date,current,result,'✓ Profit record saved successfully.');
        if(typeof updateDashboard==='function')updateDashboard();
    };

    window.loadProfitCalculator=function(){
        const existing=document.getElementById('profitDate');
        const date=existing?.value||today();
        build(date);
    };
    window.loadProfitForDate=window.loadProfitCalculator;

    function refresh(){
        addStyles();
        if(document.getElementById('profitScreen'))setTimeout(function(){window.loadProfitCalculator();},0);
    }
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refresh,{once:true});else refresh();
})();


/* =========================================================
   FINAL DAILY PROFIT/OPEX CORRECTION
   Fixes: sales count display, editable Gas/Other, automatic
   labor calculation, Dashboard back button, Calculate feedback,
   and Save Profit Record.
========================================================= */
(function(){
  function N(v){ return typeof numberValue==='function'?numberValue(v):(parseFloat(v)||0); }
  function M(v){ return typeof money==='function'?money(v):'₱'+N(v).toFixed(2); }
  function T(id,v){ const e=document.getElementById(id); if(e)e.textContent=v; }
  function D(){ return typeof todayString==='function'?todayString():new Date().toISOString().slice(0,10); }
  function getDate(){ return document.getElementById('kkdpProfitDate')?.value||D(); }
  function monthlyDaily(v){return N(v)/30;}
  function normalize(list){
    return Array.isArray(list)?list.map(function(e,i){return {id:String(e.id||('emp_'+Date.now()+'_'+i)),name:String(e.name||('Employee '+(i+1))),dailyRate:N(e.dailyRate),present:e.present!==false};}):[];
  }
  function employees(){
    return Array.from(document.querySelectorAll('#kkdpEmployeeBody tr[data-id]')).map(function(r,i){
      return {id:String(r.dataset.id),name:(r.querySelector('.kkdp-emp-name')?.value||('Employee '+(i+1))).trim(),dailyRate:N(r.querySelector('.kkdp-emp-rate')?.value),present:!!r.querySelector('.kkdp-emp-present')?.checked};
    });
  }
  function labor(list){return normalize(list).reduce(function(a,e){return a+(e.present?N(e.dailyRate):0);},0);}
  function prev(date){return (Array.isArray(profitRecords)?profitRecords:[]).filter(function(r){return r&&r.date&&String(r.date)<String(date);}).sort(function(a,b){return String(b.date).localeCompare(String(a.date));})[0]||null;}
  function snapshot(date){
    const exact=(Array.isArray(profitRecords)?profitRecords:[]).find(function(r){return String(r.date)===String(date);});
    if(exact&&exact.opex)return {monthlyRent:N(exact.opex.monthlyRent),electricityMonthly:N(exact.opex.electricityMonthly),waterMonthly:N(exact.opex.waterMonthly),wifiMonthly:N(exact.opex.wifiMonthly),gas:N(exact.opex.gas),other:N(exact.opex.other),employees:normalize(exact.opex.employees)};
    const p=prev(date);
    if(p&&p.opex)return {monthlyRent:N(p.opex.monthlyRent),electricityMonthly:N(p.opex.electricityMonthly),waterMonthly:N(p.opex.waterMonthly),wifiMonthly:N(p.opex.wifiMonthly),gas:0,other:0,employees:normalize(p.opex.employees).map(function(e){e.present=true;return e;})};
    return {monthlyRent:0,electricityMonthly:0,waterMonthly:0,wifiMonthly:0,gas:0,other:0,employees:[]};
  }
  function sales(date){
    const rec=typeof getSalesRecord==='function'?getSalesRecord(date):null;
    let fs=0,os=0,fc=0,oc=0,fsales=0,ocost=0;
    if(rec){
      (Array.isArray(rec.foodItems)?rec.foodItems:[]).forEach(function(x){const q=N(x.servingsSold);fsales+=N(x.sellingPrice)*q;fs+=q;if(q>0){let r=(Array.isArray(savedRecipes)?savedRecipes:[]).find(z=>String(z.id)===String(x.recipeId));fc+=r?N(r.totalCost):N(x.recipeCost||x.foodCost);}});
      (Array.isArray(rec.otherItems)?rec.otherItems:[]).forEach(function(x){const q=N(x.quantitySold);os+=q;fsales+=0;ocost+=N(x.unitCost)*q;});
      osales=(Array.isArray(rec.otherItems)?rec.otherItems:[]).reduce(function(a,x){return a+N(x.sellingPrice)*N(x.quantitySold);},0);
    } else osales=0;
    return {foodSales:fsales,otherSales:osales,foodCost:fc,otherCost:ocost,foodCount:fs,otherCount:os};
  }
  function read(){return {monthlyRent:N(document.getElementById('kkdpRent')?.value),electricityMonthly:N(document.getElementById('kkdpElectricity')?.value),waterMonthly:N(document.getElementById('kkdpWater')?.value),wifiMonthly:N(document.getElementById('kkdpWifi')?.value),gas:N(document.getElementById('kkdpGas')?.value),other:N(document.getElementById('kkdpOther')?.value),employees:employees()};}
  function calculateFinal(showMsg){
    const date=getDate(), s=sales(date), o=read(), l=labor(o.employees);
    const daily={rent:monthlyDaily(o.monthlyRent),electricity:monthlyDaily(o.electricityMonthly),water:monthlyDaily(o.waterMonthly),wifi:monthlyDaily(o.wifiMonthly),gas:o.gas,labor:l,other:o.other};
    daily.total=daily.rent+daily.electricity+daily.water+daily.wifi+daily.gas+daily.labor+daily.other;
    const totalSales=s.foodSales+s.otherSales,totalCapital=s.foodCost+s.otherCost,profit=totalSales-totalCapital-daily.total,totalCount=s.foodCount+s.otherCount;
    T('kkdpFoodSales',M(s.foodSales));T('kkdpOtherSales',M(s.otherSales));T('kkdpOpex',M(daily.total));
    T('kkdpFoodCapital',M(s.foodCost));T('kkdpOtherCapital',M(s.otherCost));T('kkdpTotalCapital',M(totalCapital));
    T('kkdpFoodCount',String(s.foodCount));T('kkdpOtherCount',String(s.otherCount));T('kkdpSalesCount',String(totalCount));T('kkdpSalesCount2',String(totalCount));
    T('kkdpProfit',M(profit));T('kkdpRentDaily','Daily: '+M(daily.rent));T('kkdpElectricityDaily','Daily: '+M(daily.electricity));T('kkdpWaterDaily','Daily: '+M(daily.water));T('kkdpWifiDaily','Daily: '+M(daily.wifi));T('kkdpGasDaily','Daily: '+M(daily.gas));T('kkdpLaborDaily','Daily: '+M(daily.labor));T('kkdpOtherDaily','Daily: '+M(daily.other));T('kkdpOpexTotal',M(daily.total));T('kkdpLaborTotal',M(l));
    const pc=document.getElementById('kkdpProfitCard');if(pc){pc.classList.toggle('kkdp-profit-positive',profit>0);pc.classList.toggle('kkdp-profit-negative',profit<0);}
    if(showMsg){const box=document.getElementById('kkdpMessage');if(box)box.innerHTML='<div class="message success">✓ Calculation updated successfully.</div>';}
    return {foodSales:s.foodSales,otherSales:s.otherSales,totalSales:totalSales,foodCost:s.foodCost,otherCost:s.otherCost,totalCapitalCost:totalCapital,foodCount:s.foodCount,otherCount:s.otherCount,netProfit:profit,dailyOpex:daily,opex:o};
  }
  function save(date,o,r,msg){
    const record={id:Date.now().toString(),date:date,foodSales:r.foodSales,otherSales:r.otherSales,totalSales:r.totalSales,foodCost:r.foodCost,otherCost:r.otherCost,totalCost:r.totalCapitalCost,grossProfit:r.totalSales-r.totalCapitalCost,expenses:{rent:r.dailyOpex.rent,gas:r.dailyOpex.gas,electricity:r.dailyOpex.electricity,water:r.dailyOpex.water,wifi:r.dailyOpex.wifi,labor:r.dailyOpex.labor,other:r.dailyOpex.other},totalExpenses:r.dailyOpex.total,netProfit:r.netProfit,opex:{monthlyRent:N(o.monthlyRent),electricityMonthly:N(o.electricityMonthly),waterMonthly:N(o.waterMonthly),wifiMonthly:N(o.wifiMonthly),gas:N(o.gas),other:N(o.other),employees:normalize(o.employees)}};
    const idx=(Array.isArray(profitRecords)?profitRecords:[]).findIndex(function(x){return String(x.date)===String(date);});
    if(idx>=0){record.id=profitRecords[idx].id;profitRecords[idx]=record;}else{if(!Array.isArray(profitRecords))profitRecords=[];profitRecords.push(record);}
    if(typeof saveAllData==='function')saveAllData();
    const box=document.getElementById('kkdpMessage');if(box)box.innerHTML='<div class="message success">'+msg+'</div>';
    if(typeof updateDashboard==='function')updateDashboard();
    return record;
  }
  function renderEmp(list){
    const body=document.getElementById('kkdpEmployeeBody');if(!body)return;body.innerHTML='';
    normalize(list).forEach(function(e,i){const tr=document.createElement('tr');tr.dataset.id=e.id;tr.innerHTML='<td><input class="kkdp-emp-name" type="text" value="'+String(e.name).replace(/&/g,'&amp;').replace(/"/g,'&quot;')+'"></td><td><input class="kkdp-emp-rate" type="number" min="0" step="0.01" inputmode="decimal" value="'+N(e.dailyRate)+'"></td><td class="kkdp-present"><input class="kkdp-emp-present" type="checkbox" '+(e.present?'checked':'')+'></td><td><button type="button" class="btn btn-danger btn-small kkdp-delete-employee">×</button></td>';body.appendChild(tr);tr.querySelectorAll('input').forEach(function(x){x.addEventListener('input',function(){calculateFinal(false);});x.addEventListener('change',function(){calculateFinal(false);});});tr.querySelector('.kkdp-delete-employee').onclick=function(){tr.remove();calculateFinal(false);};});
    T('kkdpLaborTotal',M(labor(employees())));
  }
  function styles(){if(document.getElementById('kkdpFinalFixStyle'))return;const st=document.createElement('style');st.id='kkdpFinalFixStyle';st.textContent='.kkdp-final-back{margin-bottom:12px}.kkdp-editable-input{background:#fff!important;color:#111827!important;border:1px solid #94a3b8!important}.kkdp-opex-actions{display:flex;gap:4px;justify-content:center}.kkdp-opex-card input[readonly]{opacity:.8}.kkdp-total-card{display:flex;flex-direction:column;justify-content:center}.kkdp-message{min-height:28px}@media(max-width:600px){.kkdp-grid3{grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}.kkdp-card{padding:10px 5px}.kkdp-value{font-size:17px}.kkdp-opex-grid{grid-template-columns:repeat(4,minmax(0,1fr));gap:5px}.kkdp-opex-card{padding:8px 3px}.kkdp-opex-card input{width:100%;box-sizing:border-box;min-height:42px;font-size:14px}.kkdp-opex-actions button{font-size:10px;padding:5px 3px}.kkdp-employee-table{width:100%;table-layout:fixed}.kkdp-employee-table input{max-width:100%;box-sizing:border-box}}';document.head.appendChild(st);}
  function buildFinal(date){
    styles();const p=document.getElementById('profitScreen');if(!p)return;const o=snapshot(date);p.innerHTML='<div class="kkdp-wrap"><div class="kkdp-final-back"><button type="button" class="btn btn-secondary" id="kkdpBackDashboard">← Back to Dashboard</button></div><div class="kkdp-date-row"><label for="kkdpProfitDate">Date</label><input id="kkdpProfitDate" type="date" value="'+date+'"></div><div class="kkdp-section-title">Sales & Operating Expenses</div><div class="kkdp-grid3"><div class="kkdp-card"><span class="kkdp-label">Cooked Food Sales</span><strong class="kkdp-value" id="kkdpFoodSales">₱0.00</strong></div><div class="kkdp-card"><span class="kkdp-label">Other Items Sold</span><strong class="kkdp-value" id="kkdpOtherSales">₱0.00</strong></div><div class="kkdp-card"><span class="kkdp-label">OPEX</span><strong class="kkdp-value" id="kkdpOpex">₱0.00</strong></div></div><div class="kkdp-section-title">Daily Cost & Profit</div><div class="kkdp-grid3"><div class="kkdp-card"><span class="kkdp-label">Capital Cost</span><strong class="kkdp-value" id="kkdpTotalCapital">₱0.00</strong><span class="kkdp-sub">Food + Other Item</span></div><div class="kkdp-card"><span class="kkdp-label">Number of Sales</span><strong class="kkdp-value" id="kkdpSalesCount">0</strong><span class="kkdp-sub">Food: <span id="kkdpFoodCount">0</span> · Other: <span id="kkdpOtherCount">0</span></span></div><div class="kkdp-card" id="kkdpProfitCard"><span class="kkdp-label">Profit</span><strong class="kkdp-value" id="kkdpProfit">₱0.00</strong><span class="kkdp-sub">Sales − Capital Cost − OPEX</span></div></div><div class="kkdp-grid3" style="margin-top:6px"><div class="kkdp-card"><span class="kkdp-label">Food Capital Cost</span><strong class="kkdp-value" id="kkdpFoodCapital">₱0.00</strong></div><div class="kkdp-card"><span class="kkdp-label">Other Item Capital Cost</span><strong class="kkdp-value" id="kkdpOtherCapital">₱0.00</strong></div><div class="kkdp-card"><span class="kkdp-label">Sales Count</span><strong class="kkdp-value" id="kkdpSalesCount2">0</strong></div></div><div class="kkdp-section-title">OPEX</div><div class="kkdp-opex-grid"><div class="kkdp-opex-card"><div class="kkdp-opex-name">Rent</div><div class="kkdp-opex-type">Monthly</div><input id="kkdpRent" type="number" min="0" step="0.01" value="'+N(o.monthlyRent)+'" readonly><div class="kkdp-opex-daily" id="kkdpRentDaily">Daily: ₱0.00</div><div class="kkdp-opex-actions"><button type="button" data-edit="kkdpRent">Edit</button><button type="button" data-update="kkdpRent">Update</button></div></div><div class="kkdp-opex-card"><div class="kkdp-opex-name">Electricity</div><div class="kkdp-opex-type">Monthly Bill</div><input id="kkdpElectricity" type="number" min="0" step="0.01" value="'+N(o.electricityMonthly)+'" readonly><div class="kkdp-opex-daily" id="kkdpElectricityDaily">Daily: ₱0.00</div><div class="kkdp-opex-actions"><button type="button" data-edit="kkdpElectricity">Edit</button><button type="button" data-update="kkdpElectricity">Update</button></div></div><div class="kkdp-opex-card"><div class="kkdp-opex-name">Water</div><div class="kkdp-opex-type">Monthly Bill</div><input id="kkdpWater" type="number" min="0" step="0.01" value="'+N(o.waterMonthly)+'" readonly><div class="kkdp-opex-daily" id="kkdpWaterDaily">Daily: ₱0.00</div><div class="kkdp-opex-actions"><button type="button" data-edit="kkdpWater">Edit</button><button type="button" data-update="kkdpWater">Update</button></div></div><div class="kkdp-opex-card"><div class="kkdp-opex-name">WiFi</div><div class="kkdp-opex-type">Monthly Bill</div><input id="kkdpWifi" type="number" min="0" step="0.01" value="'+N(o.wifiMonthly)+'" readonly><div class="kkdp-opex-daily" id="kkdpWifiDaily">Daily: ₱0.00</div><div class="kkdp-opex-actions"><button type="button" data-edit="kkdpWifi">Edit</button><button type="button" data-update="kkdpWifi">Update</button></div></div><div class="kkdp-opex-card"><div class="kkdp-opex-name">Gas / LPG</div><div class="kkdp-opex-type">Daily</div><input id="kkdpGas" class="kkdp-editable-input" type="number" min="0" step="0.01" inputmode="decimal" value="'+N(o.gas)+'"><div class="kkdp-opex-daily" id="kkdpGasDaily">Daily: ₱0.00</div></div><div class="kkdp-opex-card"><div class="kkdp-opex-name">Labor</div><div class="kkdp-opex-type">Automatic</div><div class="kkdp-labor-value" id="kkdpLaborDaily">Daily: ₱0.00</div><div class="kkdp-opex-daily">Based on Present employees</div></div><div class="kkdp-opex-card"><div class="kkdp-opex-name">Other</div><div class="kkdp-opex-type">Daily</div><input id="kkdpOther" class="kkdp-editable-input" type="number" min="0" step="0.01" inputmode="decimal" value="'+N(o.other)+'"><div class="kkdp-opex-daily" id="kkdpOtherDaily">Daily: ₱0.00</div></div><div class="kkdp-opex-card kkdp-total-card"><div class="kkdp-opex-name">Total OPEX</div><div class="kkdp-opex-type">Daily</div><div class="kkdp-total-value" id="kkdpOpexTotal">₱0.00</div></div></div><div class="kkdp-employees"><div class="kkdp-employee-header"><div class="kkdp-employee-title">Employees / Labor</div><button type="button" class="btn btn-primary btn-small" id="kkdpAddEmployee">＋ Add Employee</button></div><table class="kkdp-employee-table"><thead><tr><th>Employee</th><th>Daily Rate</th><th>Present</th><th></th></tr></thead><tbody id="kkdpEmployeeBody"></tbody></table><div class="kkdp-labor-total"><span>Total Labor Cost</span><strong id="kkdpLaborTotal">₱0.00</strong></div></div><div class="kkdp-buttons"><button type="button" class="btn btn-primary" id="kkdpCalculate">Calculate</button><button type="button" class="btn btn-success" id="kkdpSave">Save Profit Record</button></div><div id="kkdpMessage" class="kkdp-message"></div></div>';
    renderEmp(o.employees);const back=document.getElementById('kkdpBackDashboard');if(back)back.onclick=function(){showScreen('homeScreen');};
    document.getElementById('kkdpProfitDate').onchange=function(){buildFinal(this.value||D());};
    ['kkdpGas','kkdpOther'].forEach(function(id){document.getElementById(id).addEventListener('input',function(){calculateFinal(false);});});
    document.querySelectorAll('[data-edit]').forEach(function(b){b.onclick=function(){const e=document.getElementById(b.dataset.edit);if(e){e.readOnly=false;e.classList.add('kkdp-editable-input');e.focus();}};});
    document.querySelectorAll('[data-update]').forEach(function(b){b.onclick=function(){const e=document.getElementById(b.dataset.update);if(e){e.readOnly=true;e.classList.remove('kkdp-editable-input');}const r=calculateFinal(false);save(getDate(),read(),r,'✓ OPEX updated successfully.');};});
    document.getElementById('kkdpAddEmployee').onclick=function(){const list=employees();list.push({id:'emp_'+Date.now()+'_'+list.length,name:'Employee '+(list.length+1),dailyRate:0,present:true});renderEmp(list);calculateFinal(false);};
    document.getElementById('kkdpCalculate').onclick=function(){calculateFinal(true);};
    document.getElementById('kkdpSave').onclick=function(){const r=calculateFinal(false);save(getDate(),read(),r,'✓ Profit record saved successfully.');};
    calculateFinal(false);
  }
  window.calculateProfit=function(){return calculateFinal(true);};
  window.saveProfitRecord=function(){const r=calculateFinal(false);return save(getDate(),read(),r,'✓ Profit record saved successfully.');};
  window.loadProfitCalculator=function(){const old=document.getElementById('profitDate');buildFinal(old?.value||D());};
  window.loadProfitForDate=window.loadProfitCalculator;
  window.calculateProfit=function(){return calculate(true);};
  window.saveProfitRecord=function(){return saveRecord('✓ Profit record saved successfully.');};
  window.loadProfitCalculator=function(){var old=document.getElementById('profitDate');build((old&&old.value)||D());};
  window.loadProfitForDate=window.loadProfitCalculator;
  function init(){if(document.getElementById('profitScreen'))setTimeout(function(){window.loadProfitCalculator();},0);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();


/* =========================================================
   DAILY PROFIT FINAL V4 — SALES LINK + CAPITAL COST + LPG
   - Reads the same dailySalesRecords used by Today's Menu & Sales
   - Supports both current and legacy food quantity field names
   - Food Capital Cost = recipe cost ONCE for each food item sold
   - Other Item Capital Cost = unit cost x units sold
   - Shows complete sales count and capital-cost breakdown
   - LPG/Gas: Amount + Consumption Days -> Daily Consumption
   - LPG has Edit / Update just like monthly OPEX cards
========================================================= */
(function(){
  'use strict';
  function N(v){return typeof numberValue==='function'?numberValue(v):(parseFloat(v)||0);}
  function M(v){return typeof money==='function'?money(v):'₱'+N(v).toLocaleString('en-PH',{minimumFractionDigits:2,maximumFractionDigits:2});}
  function D(){return typeof todayString==='function'?todayString():new Date().toISOString().slice(0,10);}
  function T(id,v){var e=document.getElementById(id);if(e)e.textContent=v;}
  function date(){return (document.getElementById('kkdpProfitDate')||{}).value||D();}
  function qtyFood(x){return N(x.servingsSold!==undefined?x.servingsSold:(x.quantitySold!==undefined?x.quantitySold:x.servings));}
  function qtyOther(x){return N(x.quantitySold!==undefined?x.quantitySold:(x.servingsSold!==undefined?x.servingsSold:x.quantity));}
  function salesRecord(d){
    if(Array.isArray(dailySalesRecords)){
      var r=dailySalesRecords.find(function(x){return x&&String(x.date)===String(d);});
      if(r)return r;
    }
    return null;
  }
  function getSales(d){
    var r=salesRecord(d), out={foodSales:0,otherSales:0,foodCost:0,otherCost:0,foodCount:0,otherCount:0};
    if(!r)return out;
    var foods=Array.isArray(r.foodItems)?r.foodItems:[];
    foods.forEach(function(x){
      var q=qtyFood(x), price=N(x.sellingPrice!==undefined?x.sellingPrice:x.selling_price);
      out.foodSales += price*q;
      out.foodCount += q;
      if(q>0){
        var recipe=null;
        if(Array.isArray(savedRecipes)) recipe=savedRecipes.find(function(z){return String(z.id)===String(x.recipeId);});
        /* Use the recipe cost stored on the sale first. This is a snapshot
           and remains correct even if the recipe is later edited/deleted. */
        var rc=N(x.recipeCost!==undefined?x.recipeCost:(x.foodCost!==undefined?x.foodCost:x.costPerServing));
        if(!rc && recipe)rc=N(recipe.totalCost);
        out.foodCost += rc;
      }
    });
    var others=Array.isArray(r.otherItems)?r.otherItems:[];
    others.forEach(function(x){
      var q=qtyOther(x), price=N(x.sellingPrice!==undefined?x.sellingPrice:x.selling_price), unit=N(x.unitCost!==undefined?x.unitCost:x.unit_cost);
      out.otherSales += price*q;
      out.otherCost += unit*q;
      out.otherCount += q;
    });
    return out;
  }
  function normalize(list){
    return Array.isArray(list)?list.map(function(e,i){return {id:String(e.id||('emp_'+Date.now()+'_'+i)),name:String(e.name||('Employee '+(i+1))),dailyRate:N(e.dailyRate),present:e.present!==false};}):[];
  }
  function employeesFromUI(){
    return Array.from(document.querySelectorAll('#kkdpEmployeeBody tr[data-id]')).map(function(r,i){
      return {id:String(r.dataset.id),name:(r.querySelector('.kkdp-emp-name')?.value||('Employee '+(i+1))).trim(),dailyRate:N(r.querySelector('.kkdp-emp-rate')?.value),present:!!r.querySelector('.kkdp-emp-present')?.checked};
    });
  }
  function labor(es){return normalize(es).reduce(function(a,e){return a+(e.present?N(e.dailyRate):0);},0);}
  function prev(d){return (Array.isArray(profitRecords)?profitRecords:[]).filter(function(r){return r&&r.date&&String(r.date)<String(d);}).sort(function(a,b){return String(b.date).localeCompare(String(a.date));})[0]||null;}
  function snap(d){
    var exact=(Array.isArray(profitRecords)?profitRecords:[]).find(function(r){return String(r.date)===String(d);});
    if(exact&&exact.opex)return exact.opex;
    var p=prev(d);if(p&&p.opex)return p.opex;
    return {monthlyRent:0,electricityMonthly:0,waterMonthly:0,wifiMonthly:0,gas:0,gasAmount:0,gasDays:1,other:0,employees:[]};
  }
  function readOpex(){
    var gasAmount=N(document.getElementById('kkdpGasAmount')?.value), gasDays=N(document.getElementById('kkdpGasDays')?.value)||1;
    return {
      monthlyRent:N(document.getElementById('kkdpRent')?.value),
      electricityMonthly:N(document.getElementById('kkdpElectricity')?.value),
      waterMonthly:N(document.getElementById('kkdpWater')?.value),
      wifiMonthly:N(document.getElementById('kkdpWifi')?.value),
      gas:gasAmount/gasDays, gasAmount:gasAmount, gasDays:gasDays,
      other:N(document.getElementById('kkdpOther')?.value), employees:employeesFromUI()
    };
  }
  function calculate(showMsg){
    var s=getSales(date()),o=readOpex(),l=labor(o.employees);
    var daily={rent:o.monthlyRent/30,electricity:o.electricityMonthly/30,water:o.waterMonthly/30,wifi:o.wifiMonthly/30,gas:o.gas,labor:l,other:o.other};
    daily.total=daily.rent+daily.electricity+daily.water+daily.wifi+daily.gas+daily.labor+daily.other;
    var totalSales=s.foodSales+s.otherSales,totalCapital=s.foodCost+s.otherCost,totalCount=s.foodCount+s.otherCount,profit=totalSales-totalCapital-daily.total;
    T('kkdpFoodSales',M(s.foodSales));T('kkdpOtherSales',M(s.otherSales));T('kkdpOpex',M(daily.total));
    T('kkdpFoodCapital',M(s.foodCost));T('kkdpOtherCapital',M(s.otherCost));T('kkdpTotalCapital',M(totalCapital));
    T('kkdpFoodCount',String(s.foodCount));T('kkdpOtherCount',String(s.otherCount));T('kkdpSalesCount',String(totalCount));T('kkdpSalesCount2',String(totalCount));
    T('kkdpProfit',M(profit));T('kkdpRentDaily','Daily: '+M(daily.rent));T('kkdpElectricityDaily','Daily: '+M(daily.electricity));T('kkdpWaterDaily','Daily: '+M(daily.water));T('kkdpWifiDaily','Daily: '+M(daily.wifi));
    T('kkdpGasDaily','Daily Consumption: '+M(daily.gas));T('kkdpLaborDaily','Daily: '+M(daily.labor));T('kkdpOtherDaily','Daily: '+M(daily.other));T('kkdpOpexTotal',M(daily.total));T('kkdpLaborTotal',M(l));
    var pc=document.getElementById('kkdpProfitCard');if(pc){pc.classList.toggle('kkdp-profit-positive',profit>0);pc.classList.toggle('kkdp-profit-negative',profit<0);}
    if(showMsg){var b=document.getElementById('kkdpMessage');if(b)b.innerHTML='<div class="message success">✓ Calculation updated successfully.</div>';}
    return {foodSales:s.foodSales,otherSales:s.otherSales,totalSales:totalSales,foodCost:s.foodCost,otherCost:s.otherCost,totalCapitalCost:totalCapital,foodCount:s.foodCount,otherCount:s.otherCount,netProfit:profit,dailyOpex:daily,opex:o};
  }
  function saveRecord(msg){
    var d=date(),r=calculate(false),o=readOpex();
    var rec={id:Date.now().toString(),date:d,foodSales:r.foodSales,otherSales:r.otherSales,totalSales:r.totalSales,foodCost:r.foodCost,otherCost:r.otherCost,totalCost:r.totalCapitalCost,grossProfit:r.totalSales-r.totalCapitalCost,expenses:{rent:r.dailyOpex.rent,gas:r.dailyOpex.gas,electricity:r.dailyOpex.electricity,water:r.dailyOpex.water,wifi:r.dailyOpex.wifi,labor:r.dailyOpex.labor,other:r.dailyOpex.other},totalExpenses:r.dailyOpex.total,netProfit:r.netProfit,opex:{monthlyRent:o.monthlyRent,electricityMonthly:o.electricityMonthly,waterMonthly:o.waterMonthly,wifiMonthly:o.wifiMonthly,gas:o.gas,gasAmount:o.gasAmount,gasDays:o.gasDays,other:o.other,employees:normalize(o.employees)}};
    var idx=Array.isArray(profitRecords)?profitRecords.findIndex(function(x){return String(x.date)===String(d);}):-1;
    if(idx>=0){rec.id=profitRecords[idx].id;profitRecords[idx]=rec;}else{if(!Array.isArray(profitRecords))profitRecords=[];profitRecords.push(rec);}
    if(typeof saveAllData==='function')saveAllData();
    var b=document.getElementById('kkdpMessage');if(b)b.innerHTML='<div class="message success">'+msg+'</div>';
    if(typeof updateDashboard==='function')updateDashboard();
    return rec;
  }
  function renderEmployees(list){
    var body=document.getElementById('kkdpEmployeeBody');if(!body)return;body.innerHTML='';
    normalize(list).forEach(function(e,i){
      var tr=document.createElement('tr');tr.dataset.id=e.id;
      tr.innerHTML='<td><input class="kkdp-emp-name" type="text" value="'+String(e.name).replace(/&/g,'&amp;').replace(/"/g,'&quot;')+'"></td><td><input class="kkdp-emp-rate" type="number" min="0" step="0.01" inputmode="decimal" value="'+N(e.dailyRate)+'"></td><td><input class="kkdp-emp-present" type="checkbox" '+(e.present?'checked':'')+'></td><td><button type="button" class="btn btn-danger btn-small kkdp-delete-employee">×</button></td>';
      body.appendChild(tr);tr.querySelectorAll('input').forEach(function(inp){inp.addEventListener('input',function(){calculate(false);});inp.addEventListener('change',function(){calculate(false);});});
      tr.querySelector('.kkdp-delete-employee').onclick=function(){tr.remove();calculate(false);};
    });
  }
  function build(d){
    styles();
    var p=document.getElementById('profitScreen');if(!p)return;
    var o=snap(d),ga=N(o.gasAmount||o.gas),gd=N(o.gasDays)||1;
    p.innerHTML='<div class="kkdp-wrap"><div class="kkdp-final-back"><button type="button" class="btn btn-secondary" id="kkdpBackDashboard">← Back to Dashboard</button></div><div class="kkdp-date-row"><label>Date</label><input id="kkdpProfitDate" type="date" value="'+d+'"></div><div class="kkdp-section-title">Sales & Operating Expenses</div><div class="kkdp-grid3"><div class="kkdp-card"><span class="kkdp-label">Cooked Food Sales</span><strong class="kkdp-value" id="kkdpFoodSales">₱0.00</strong></div><div class="kkdp-card"><span class="kkdp-label">Other Items Sold</span><strong class="kkdp-value" id="kkdpOtherSales">₱0.00</strong></div><div class="kkdp-card"><span class="kkdp-label">OPEX</span><strong class="kkdp-value" id="kkdpOpex">₱0.00</strong></div></div><div class="kkdp-section-title">Daily Cost & Profit</div><div class="kkdp-grid3"><div class="kkdp-card"><span class="kkdp-label">Capital Cost</span><strong class="kkdp-value" id="kkdpTotalCapital">₱0.00</strong><span class="kkdp-sub">Food + Other Item</span><div class="kkdp-breakdown">Food: <strong id="kkdpFoodCapital">₱0.00</strong><br>Other Item: <strong id="kkdpOtherCapital">₱0.00</strong></div></div><div class="kkdp-card"><span class="kkdp-label">Number of Sales</span><strong class="kkdp-value" id="kkdpSalesCount">0</strong><span class="kkdp-sub">Food: <span id="kkdpFoodCount">0</span> · Other Item: <span id="kkdpOtherCount">0</span></span><div class="kkdp-breakdown">Sales Count: <strong id="kkdpSalesCount2">0</strong></div></div><div class="kkdp-card" id="kkdpProfitCard"><span class="kkdp-label">Profit</span><strong class="kkdp-value" id="kkdpProfit">₱0.00</strong><span class="kkdp-sub">Sales − Capital Cost − OPEX</span></div></div><div class="kkdp-section-title">OPEX</div><div class="kkdp-opex-grid"><div class="kkdp-opex-card"><div class="kkdp-opex-name">Rent</div><div class="kkdp-opex-type">Monthly</div><input id="kkdpRent" type="number" min="0" step="0.01" value="'+N(o.monthlyRent)+'" readonly><div class="kkdp-opex-daily" id="kkdpRentDaily">Daily: ₱0.00</div><div class="kkdp-opex-actions"><button type="button" data-edit="kkdpRent">Edit</button><button type="button" data-update="kkdpRent">Update</button></div></div><div class="kkdp-opex-card"><div class="kkdp-opex-name">Electricity</div><div class="kkdp-opex-type">Monthly Bill</div><input id="kkdpElectricity" type="number" min="0" step="0.01" value="'+N(o.electricityMonthly)+'" readonly><div class="kkdp-opex-daily" id="kkdpElectricityDaily">Daily: ₱0.00</div><div class="kkdp-opex-actions"><button type="button" data-edit="kkdpElectricity">Edit</button><button type="button" data-update="kkdpElectricity">Update</button></div></div><div class="kkdp-opex-card"><div class="kkdp-opex-name">Water</div><div class="kkdp-opex-type">Monthly Bill</div><input id="kkdpWater" type="number" min="0" step="0.01" value="'+N(o.waterMonthly)+'" readonly><div class="kkdp-opex-daily" id="kkdpWaterDaily">Daily: ₱0.00</div><div class="kkdp-opex-actions"><button type="button" data-edit="kkdpWater">Edit</button><button type="button" data-update="kkdpWater">Update</button></div></div><div class="kkdp-opex-card"><div class="kkdp-opex-name">WiFi</div><div class="kkdp-opex-type">Monthly Bill</div><input id="kkdpWifi" type="number" min="0" step="0.01" value="'+N(o.wifiMonthly)+'" readonly><div class="kkdp-opex-daily" id="kkdpWifiDaily">Daily: ₱0.00</div><div class="kkdp-opex-actions"><button type="button" data-edit="kkdpWifi">Edit</button><button type="button" data-update="kkdpWifi">Update</button></div></div><div class="kkdp-opex-card kkdp-gas-card"><div class="kkdp-opex-name">Gas / LPG</div><div class="kkdp-opex-type">Variable</div><input id="kkdpGasAmount" class="kkdp-editable-input" type="number" min="0" step="0.01" inputmode="decimal" value="'+ga+'" placeholder="LPG amount"><label class="kkdp-mini-label">Consumption Days</label><input id="kkdpGasDays" class="kkdp-editable-input" type="number" min="1" step="1" inputmode="numeric" value="'+gd+'"><div class="kkdp-opex-daily" id="kkdpGasDaily">Daily Consumption: ₱0.00</div><div class="kkdp-opex-actions"><button type="button" id="kkdpGasEdit">Edit</button><button type="button" id="kkdpGasUpdate">Update</button></div></div><div class="kkdp-opex-card"><div class="kkdp-opex-name">Labor</div><div class="kkdp-opex-type">Automatic</div><div class="kkdp-labor-value" id="kkdpLaborDaily">Daily: ₱0.00</div><div class="kkdp-opex-daily">Based on Present employees</div></div><div class="kkdp-opex-card"><div class="kkdp-opex-name">Other</div><div class="kkdp-opex-type">Daily</div><input id="kkdpOther" class="kkdp-editable-input" type="number" min="0" step="0.01" inputmode="decimal" value="'+N(o.other)+'"><div class="kkdp-opex-daily" id="kkdpOtherDaily">Daily: ₱0.00</div></div><div class="kkdp-opex-card kkdp-total-card"><div class="kkdp-opex-name">Total OPEX</div><div class="kkdp-opex-type">Daily</div><div class="kkdp-total-value" id="kkdpOpexTotal">₱0.00</div></div></div><div class="kkdp-employees"><div class="kkdp-employee-header"><div class="kkdp-employee-title">Employees / Labor</div><button type="button" class="btn btn-primary btn-small" id="kkdpAddEmployee">＋ Add Employee</button></div><table class="kkdp-employee-table"><thead><tr><th>Employee</th><th>Daily Rate</th><th>Present</th><th></th></tr></thead><tbody id="kkdpEmployeeBody"></tbody></table><div class="kkdp-labor-total"><span>Total Labor Cost</span><strong id="kkdpLaborTotal">₱0.00</strong></div></div><div class="kkdp-buttons"><button type="button" class="btn btn-primary" id="kkdpCalculate">Calculate</button><button type="button" class="btn btn-success" id="kkdpSave">Save Profit Record</button></div><div id="kkdpMessage" class="kkdp-message"></div></div>';
    renderEmployees(o.employees);
    var back=document.getElementById('kkdpBackDashboard');if(back)back.onclick=function(){showScreen('homeScreen');};
    document.getElementById('kkdpProfitDate').onchange=function(){build(this.value||D());};
    ['kkdpGasAmount','kkdpGasDays','kkdpOther'].forEach(function(id){var e=document.getElementById(id);if(e)e.addEventListener('input',function(){calculate(false);});});
    document.querySelectorAll('[data-edit]').forEach(function(b){b.onclick=function(){var e=document.getElementById(b.dataset.edit);if(e){e.readOnly=false;e.classList.add('kkdp-editable-input');e.focus();}};});
    document.querySelectorAll('[data-update]').forEach(function(b){b.onclick=function(){var e=document.getElementById(b.dataset.update);if(e){e.readOnly=true;e.classList.remove('kkdp-editable-input');}var r=calculate(false);saveRecord('✓ OPEX updated successfully.');};});
    var ge=document.getElementById('kkdpGasEdit'),gu=document.getElementById('kkdpGasUpdate');
    function gasInputs(on){['kkdpGasAmount','kkdpGasDays'].forEach(function(id){var e=document.getElementById(id);if(e)e.readOnly=!on;});}
    if(ge)ge.onclick=function(){gasInputs(true);document.getElementById('kkdpGasAmount')?.focus();};
    if(gu)gu.onclick=function(){gasInputs(false);calculate(false);saveRecord('✓ Gas / LPG updated successfully.');};
    document.getElementById('kkdpAddEmployee').onclick=function(){var list=employeesFromUI();list.push({id:'emp_'+Date.now()+'_'+list.length,name:'Employee '+(list.length+1),dailyRate:0,present:true});renderEmployees(list);calculate(false);};
    document.getElementById('kkdpCalculate').onclick=function(){calculate(true);};
    document.getElementById('kkdpSave').onclick=function(){saveRecord('✓ Profit record saved successfully.');};
    calculate(false);
  }
  window.calculateProfit=function(){return calculate(true);};
  window.saveProfitRecord=function(){return saveRecord('✓ Profit record saved successfully.');};
  window.loadProfitCalculator=function(){var old=document.getElementById('profitDate');build((old&&old.value)||D());};
  window.loadProfitForDate=window.loadProfitCalculator;

  /* ================================================================
     DAILY EXPENSES REDESIGN — SALES / CAPEX / OPEX / PROFIT
     Four-column summary and section grids. Profit is finalized only
     when Calculate or Save is pressed; source sales/cost data remains live.
     ================================================================ */
  function snap(d){
    var exact=(Array.isArray(profitRecords)?profitRecords:[]).find(function(r){return String(r.date)===String(d);});
    if(exact&&exact.opex)return Object.assign({monthlyRent:0,electricityMonthly:0,waterMonthly:0,wifiMonthly:0,gas:0,gasAmount:0,gasDays:1,other:0,transportation:0,otherFees:0,employees:[]},exact.opex);
    var p=prev(d);
    if(p&&p.opex)return Object.assign({monthlyRent:0,electricityMonthly:0,waterMonthly:0,wifiMonthly:0,gas:0,gasAmount:0,gasDays:1,other:0,transportation:0,otherFees:0,employees:[]},p.opex,{gas:0,gasAmount:0,gasDays:1,other:0,transportation:0,otherFees:0,employees:normalize(p.opex.employees).map(function(e){return Object.assign({},e,{present:true});})});
    return {monthlyRent:0,electricityMonthly:0,waterMonthly:0,wifiMonthly:0,gas:0,gasAmount:0,gasDays:1,other:0,transportation:0,otherFees:0,employees:[]};
  }
  function readOpex(){
    var gasAmount=N(document.getElementById('kkdpGasAmount')?.value),gasDays=Math.max(1,N(document.getElementById('kkdpGasDays')?.value)||1);
    return {monthlyRent:N(document.getElementById('kkdpRent')?.value),electricityMonthly:N(document.getElementById('kkdpElectricity')?.value),waterMonthly:N(document.getElementById('kkdpWater')?.value),wifiMonthly:N(document.getElementById('kkdpWifi')?.value),gas:gasAmount/gasDays,gasAmount:gasAmount,gasDays:gasDays,other:N(document.getElementById('kkdpOther')?.value),transportation:N(document.getElementById('kkdpTransportation')?.value),otherFees:N(document.getElementById('kkdpOtherFees')?.value),employees:employeesFromUI()};
  }
  function calculate(showMsg){
    var s=getSales(date()),o=readOpex(),l=labor(o.employees);
    var daily={rent:o.monthlyRent/30,electricity:o.electricityMonthly/30,water:o.waterMonthly/30,wifi:o.wifiMonthly/30,gas:o.gas,labor:l,other:o.other,transportation:o.transportation};
    daily.total=daily.rent+daily.electricity+daily.water+daily.wifi+daily.gas+daily.labor+daily.other+daily.transportation;
    var totalSales=s.foodSales+s.otherSales,totalCapital=s.foodCost+s.otherCost+o.otherFees,totalCount=s.foodCount+s.otherCount,profit=totalSales-totalCapital-daily.total;
    T('kkdpSummarySales',M(totalSales));T('kkdpSummaryCapex',M(totalCapital));T('kkdpSummaryOpex',M(daily.total));
    T('kkdpFoodSales',M(s.foodSales));T('kkdpOtherSales',M(s.otherSales));T('kkdpFoodCount',String(s.foodCount));T('kkdpOtherCount',String(s.otherCount));
    T('kkdpFoodCapital',M(s.foodCost));T('kkdpOtherCapital',M(s.otherCost));T('kkdpOtherFeesDisplay',M(o.otherFees));T('kkdpTotalCapital',M(totalCapital));
    T('kkdpRentDaily','Daily: '+M(daily.rent));T('kkdpElectricityDaily','Daily: '+M(daily.electricity));T('kkdpWaterDaily','Daily: '+M(daily.water));T('kkdpWifiDaily','Daily: '+M(daily.wifi));T('kkdpGasDaily','Daily Consumption: '+M(daily.gas));T('kkdpLaborDaily','Daily: '+M(daily.labor));T('kkdpOtherDaily','Daily: '+M(daily.other));T('kkdpTransportationDaily','Daily: '+M(daily.transportation));T('kkdpOpexTotal',M(daily.total));T('kkdpLaborTotal',M(l));
    T('kkdpSummaryProfit',M(profit));
    var pc=document.getElementById('kkdpSummaryProfitCard');if(pc){pc.classList.toggle('kkdp-profit-positive',profit>0);pc.classList.toggle('kkdp-profit-negative',profit<0);}
    if(showMsg){
      var b=document.getElementById('kkdpMessage');if(b)b.innerHTML='<div class="message success">✓ Profit calculated successfully.</div>';
    }
    return {foodSales:s.foodSales,otherSales:s.otherSales,totalSales:totalSales,foodCost:s.foodCost,otherCost:s.otherCost,otherFees:o.otherFees,totalCapitalCost:totalCapital,foodCount:s.foodCount,otherCount:s.otherCount,netProfit:profit,dailyOpex:daily,opex:o};
  }
  function saveRecord(msg){
    var d=date(),r=calculate(true),o=readOpex();
    var rec={id:Date.now().toString(),date:d,foodSales:r.foodSales,otherSales:r.otherSales,totalSales:r.totalSales,foodCost:r.foodCost,otherCost:r.otherCost,otherFees:o.otherFees,totalCost:r.totalCapitalCost,grossProfit:r.totalSales-r.totalCapitalCost,expenses:{rent:r.dailyOpex.rent,gas:r.dailyOpex.gas,electricity:r.dailyOpex.electricity,water:r.dailyOpex.water,wifi:r.dailyOpex.wifi,labor:r.dailyOpex.labor,other:r.dailyOpex.other,transportation:r.dailyOpex.transportation},totalExpenses:r.dailyOpex.total,netProfit:r.netProfit,opex:{monthlyRent:o.monthlyRent,electricityMonthly:o.electricityMonthly,waterMonthly:o.waterMonthly,wifiMonthly:o.wifiMonthly,gas:o.gas,gasAmount:o.gasAmount,gasDays:o.gasDays,other:o.other,transportation:o.transportation,otherFees:o.otherFees,employees:normalize(o.employees)}};
    var idx=Array.isArray(profitRecords)?profitRecords.findIndex(function(x){return String(x.date)===String(d);}):-1;
    if(idx>=0){rec.id=profitRecords[idx].id;profitRecords[idx]=rec;}else{if(!Array.isArray(profitRecords))profitRecords=[];profitRecords.push(rec);}
    if(typeof saveAllData==='function')saveAllData();
    var b=document.getElementById('kkdpMessage');if(b)b.innerHTML='<div class="message success">'+msg+'</div>';
    if(typeof updateDashboard==='function')updateDashboard();
    return rec;
  }
  function build(d){
    styles();
    var p=document.getElementById('profitScreen');if(!p)return;
    var o=snap(d),ga=N(o.gasAmount!==undefined?o.gasAmount:o.gas),gd=Math.max(1,N(o.gasDays)||1);
    p.innerHTML='<style>.kkdp-grid4{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.kkdp-grid4 .kkdp-card{min-width:0;padding:10px 6px;text-align:center;overflow-wrap:anywhere}.kkdp-grid4 .kkdp-label{display:block;font-size:clamp(10px,2.5vw,13px);line-height:1.2;min-height:25px}.kkdp-grid4 .kkdp-value{display:block;font-size:clamp(12px,3vw,17px);line-height:1.25;overflow-wrap:anywhere}.kkdp-section-title{margin-top:18px}.kkdp-opex-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.kkdp-opex-card{min-width:0;padding:9px 7px;overflow-wrap:anywhere}.kkdp-opex-card input{width:100%;min-width:0;box-sizing:border-box}.kkdp-opex-name{font-size:clamp(11px,2.8vw,14px)}.kkdp-opex-actions{display:flex;gap:4px;flex-wrap:wrap}.kkdp-opex-actions button{flex:1;min-width:0;padding:6px 4px;font-size:12px}.kkdp-final-summary{margin-bottom:14px}.kkdp-profit-positive{border-color:#16834a!important;color:#16834a}.kkdp-profit-negative{border-color:#c62828!important;color:#c62828}.kkdp-field-label{display:block;font-size:12px;margin:7px 0 4px}.kkdp-input-small{width:100%;min-width:0;box-sizing:border-box;padding:8px;border:1px solid #cbd5e1;border-radius:8px}@media(max-width:430px){.kkdp-grid4{gap:4px}.kkdp-grid4 .kkdp-card{padding:8px 3px}.kkdp-opex-grid{gap:5px}.kkdp-opex-card{padding:7px 4px}.kkdp-opex-actions button{font-size:10px;padding:6px 2px}}</style><div class="kkdp-wrap"><div class="kkdp-final-back"><button type="button" class="btn btn-secondary" id="kkdpBackDashboard">← Back to Dashboard</button></div><div class="kkdp-date-row"><label for="kkdpProfitDate">Date</label><input id="kkdpProfitDate" type="date" value="'+d+'"></div><div class="kkdp-grid4 kkdp-final-summary"><div class="kkdp-card"><span class="kkdp-label">Sales</span><strong class="kkdp-value" id="kkdpSummarySales">₱0.00</strong></div><div class="kkdp-card"><span class="kkdp-label">Total CAPEX</span><strong class="kkdp-value" id="kkdpSummaryCapex">₱0.00</strong></div><div class="kkdp-card"><span class="kkdp-label">Total OPEX</span><strong class="kkdp-value" id="kkdpSummaryOpex">₱0.00</strong></div><div class="kkdp-card" id="kkdpSummaryProfitCard"><span class="kkdp-label">Profit</span><strong class="kkdp-value" id="kkdpSummaryProfit">₱0.00</strong></div></div><div class="kkdp-section-title">2. SALES</div><div class="kkdp-grid4"><div class="kkdp-card"><span class="kkdp-label">Cooked Food Sales</span><strong class="kkdp-value" id="kkdpFoodSales">₱0.00</strong></div><div class="kkdp-card"><span class="kkdp-label">Other Items Sold</span><strong class="kkdp-value" id="kkdpOtherSales">₱0.00</strong></div><div class="kkdp-card"><span class="kkdp-label">Food Sales Count</span><strong class="kkdp-value" id="kkdpFoodCount">0</strong></div><div class="kkdp-card"><span class="kkdp-label">Items Sales Count</span><strong class="kkdp-value" id="kkdpOtherCount">0</strong></div></div><div class="kkdp-section-title">3. CAPEX</div><div class="kkdp-grid4"><div class="kkdp-card"><span class="kkdp-label">Recipe Cost</span><strong class="kkdp-value" id="kkdpFoodCapital">₱0.00</strong></div><div class="kkdp-card"><span class="kkdp-label">Cost of Goods</span><strong class="kkdp-value" id="kkdpOtherCapital">₱0.00</strong></div><div class="kkdp-card"><span class="kkdp-label">Other Fees</span><input class="kkdp-input-small" id="kkdpOtherFees" type="number" min="0" step="0.01" inputmode="decimal" value="'+N(o.otherFees)+'"><span class="kkdp-field-label" id="kkdpOtherFeesDisplay">₱0.00</span></div><div class="kkdp-card"><span class="kkdp-label">Total CAPEX</span><strong class="kkdp-value" id="kkdpTotalCapital">₱0.00</strong></div></div><div class="kkdp-section-title">4. OPEX</div><div class="kkdp-opex-grid"><div class="kkdp-opex-card"><div class="kkdp-opex-name">Rent</div><div class="kkdp-opex-type">Monthly</div><input id="kkdpRent" type="number" min="0" step="0.01" inputmode="decimal" value="'+N(o.monthlyRent)+'"><div class="kkdp-opex-daily" id="kkdpRentDaily">Daily: ₱0.00</div></div><div class="kkdp-opex-card"><div class="kkdp-opex-name">Electricity</div><div class="kkdp-opex-type">Monthly Bill</div><input id="kkdpElectricity" type="number" min="0" step="0.01" inputmode="decimal" value="'+N(o.electricityMonthly)+'"><div class="kkdp-opex-daily" id="kkdpElectricityDaily">Daily: ₱0.00</div></div><div class="kkdp-opex-card"><div class="kkdp-opex-name">Water</div><div class="kkdp-opex-type">Monthly Bill</div><input id="kkdpWater" type="number" min="0" step="0.01" inputmode="decimal" value="'+N(o.waterMonthly)+'"><div class="kkdp-opex-daily" id="kkdpWaterDaily">Daily: ₱0.00</div></div><div class="kkdp-opex-card"><div class="kkdp-opex-name">WiFi</div><div class="kkdp-opex-type">Monthly Bill</div><input id="kkdpWifi" type="number" min="0" step="0.01" inputmode="decimal" value="'+N(o.wifiMonthly)+'"><div class="kkdp-opex-daily" id="kkdpWifiDaily">Daily: ₱0.00</div></div><div class="kkdp-opex-card kkdp-gas-card"><div class="kkdp-opex-name">Gas / LPG</div><div class="kkdp-opex-type">Amount / Days</div><label class="kkdp-field-label" for="kkdpGasAmount">LPG Amount (₱)</label><input id="kkdpGasAmount" class="kkdp-editable-input" type="number" min="0" step="0.01" inputmode="decimal" value="'+ga+'"><label class="kkdp-field-label" for="kkdpGasDays">Consumption Days</label><input id="kkdpGasDays" class="kkdp-editable-input" type="number" min="1" step="1" inputmode="numeric" value="'+gd+'"><div class="kkdp-opex-daily" id="kkdpGasDaily">Daily Consumption: ₱0.00</div><div class="kkdp-opex-actions"><button type="button" id="kkdpGasEdit">Edit</button><button type="button" id="kkdpGasUpdate">Update</button></div></div><div class="kkdp-opex-card"><div class="kkdp-opex-name">Labor</div><div class="kkdp-opex-type">Automatic</div><div class="kkdp-labor-value" id="kkdpLaborDaily">Daily: ₱0.00</div><div class="kkdp-opex-daily">Based on Present employees</div></div><div class="kkdp-opex-card"><div class="kkdp-opex-name">Other</div><div class="kkdp-opex-type">Daily</div><input id="kkdpOther" class="kkdp-editable-input" type="number" min="0" step="0.01" inputmode="decimal" value="'+N(o.other)+'"><div class="kkdp-opex-daily" id="kkdpOtherDaily">Daily: ₱0.00</div></div><div class="kkdp-opex-card"><div class="kkdp-opex-name">Transportation Cost</div><div class="kkdp-opex-type">Daily</div><input id="kkdpTransportation" class="kkdp-editable-input" type="number" min="0" step="0.01" inputmode="decimal" value="'+N(o.transportation)+'"><div class="kkdp-opex-daily" id="kkdpTransportationDaily">Daily: ₱0.00</div></div></div><div class="kkdp-opex-card kkdp-total-card" style="margin-top:8px"><div class="kkdp-opex-name">Total OPEX</div><div class="kkdp-opex-type">Daily</div><div class="kkdp-total-value" id="kkdpOpexTotal">₱0.00</div></div><div class="kkdp-employees"><div class="kkdp-employee-header"><div class="kkdp-employee-title">Employees / Labor</div><button type="button" class="btn btn-primary btn-small" id="kkdpAddEmployee">＋ Add Employee</button></div><table class="kkdp-employee-table"><thead><tr><th>Employee</th><th>Daily Rate</th><th>Present</th><th></th></tr></thead><tbody id="kkdpEmployeeBody"></tbody></table><div class="kkdp-labor-total"><span>Total Labor Cost</span><strong id="kkdpLaborTotal">₱0.00</strong></div></div><div class="kkdp-buttons"><button type="button" class="btn btn-primary" id="kkdpCalculate">Calculate</button><button type="button" class="btn btn-success" id="kkdpSave">Save Profit Record</button></div><div id="kkdpMessage" class="kkdp-message"></div></div>';
    renderEmployees(o.employees);
    var back=document.getElementById('kkdpBackDashboard');if(back)back.onclick=function(){showScreen('homeScreen');};
    document.getElementById('kkdpProfitDate').onchange=function(){build(this.value||D());};
    ['kkdpRent','kkdpElectricity','kkdpWater','kkdpWifi','kkdpGasAmount','kkdpGasDays','kkdpOther','kkdpTransportation','kkdpOtherFees'].forEach(function(id){var e=document.getElementById(id);if(e)e.addEventListener('input',function(){calculate(false);});});
    document.getElementById('kkdpAddEmployee').onclick=function(){var list=employeesFromUI();list.push({id:'emp_'+Date.now()+'_'+list.length,name:'Employee '+(list.length+1),dailyRate:0,present:true});renderEmployees(list);calculate(false);};
    document.getElementById('kkdpCalculate').onclick=function(){calculate(true);};
    document.getElementById('kkdpSave').onclick=function(){saveRecord('✓ Profit record saved successfully.');};
    calculate(false);
  }
  window.calculateProfit=function(){return calculate(true);};
  window.saveProfitRecord=function(){return saveRecord('✓ Profit record saved successfully.');};
  window.loadProfitCalculator=function(){var old=document.getElementById('profitDate');build((old&&old.value)||D());};
  window.loadProfitForDate=window.loadProfitCalculator;
  function init(){if(document.getElementById('profitScreen'))setTimeout(function(){window.loadProfitCalculator();},0);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();

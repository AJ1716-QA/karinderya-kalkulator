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
function populateMasterOtherItemSelect(keepName){const select=document.getElementById("otherItemName");if(!select)return;const current=keepName||select.value;const savedNames=new Set(otherItems.map(x=>x.name.toLowerCase()));select.innerHTML='<option value="">Select other item...</option>';masterOtherItems.forEach(name=>{if(name!=="__custom__"&&savedNames.has(name.toLowerCase())&&name.toLowerCase()!==String(current).toLowerCase())return;const o=document.createElement("option");o.value=name;o.textContent=name==="__custom__"?"➕ Add Custom Item":name;select.appendChild(o);});if(current)select.value=current;}

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
function clearOtherItemForm(){["otherPurchasePrice","otherQuantity","otherUnit","otherSellingPrice","customOtherItemName"].forEach(id=>{const e=document.getElementById(id);if(e)e.value=""});const e=document.getElementById("otherItemName");if(e)e.value="";const b=document.querySelector('#ingredientScreen button[onclick^="saveOtherItem"]');if(b){b.textContent="Save Other Item";b.onclick=()=>saveOtherItem();}handleCustomOtherItem();}
function editOtherItem(id){const item=otherItems.find(x=>String(x.id)===String(id));if(!item)return;document.getElementById("otherItemName").value=item.name;document.getElementById("otherPurchasePrice").value=item.purchasePrice;document.getElementById("otherQuantity").value=item.quantity;document.getElementById("otherUnit").value=item.unit;document.getElementById("otherSellingPrice").value=item.sellingPrice;const b=document.querySelector('#ingredientScreen button[onclick^="saveOtherItem"]');if(b){b.textContent="Update Other Item";b.onclick=()=>saveOtherItem(id);}showScreen("ingredientScreen");populateMasterOtherItemSelect(item.name);handleCustomOtherItem();window.scrollTo(0,0);}
async function renderOtherItemList(){const c=document.getElementById("otherItemList");if(!c)return;const userId=await getCurrentUserId();if(!userId)return;const {data,error}=await supabaseClient.from("other_items").select("*").eq("user_id",userId).order("created_at",{ascending:false});if(error){c.innerHTML='<div class="empty">Unable to load saved other items.</div>';return;}otherItems=(data||[]).map(x=>({id:String(x.id),name:x.name,purchasePrice:numberValue(x.purchase_price),quantity:numberValue(x.quantity),unit:x.unit||"",unitCost:numberValue(x.unit_cost),sellingPrice:numberValue(x.selling_price)}));c.innerHTML=otherItems.length?"":'<div class="empty">No other items saved yet.</div>';otherItems.forEach(item=>{const d=document.createElement("div");d.className="list-item saved-row";d.innerHTML='<div class="saved-row-main"><strong>'+escapeHtml(item.name)+'</strong><span>Purchase '+money(item.purchasePrice)+' | Sell '+money(item.sellingPrice)+'</span></div><div class="saved-row-actions"><button class="btn btn-secondary btn-small" onclick="editOtherItem(\''+item.id+'\')">Edit</button><button class="btn btn-danger btn-small" onclick="deleteOtherItem(\''+item.id+'\')">Delete</button></div>';c.appendChild(d);});populateMasterOtherItemSelect();}
async function deleteOtherItem(id){if(!confirm("Delete this other item?"))return;const {error}=await supabaseClient.from("other_items").delete().eq("id",Number(id)).eq("user_id",currentUserId);if(error){showMessage("otherItemMessage","Unable to delete other item.","error");return;}await renderOtherItemList();}

/* =========================================================
   RECIPE
========================================================= */

function loadRecipeScreen() {

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
    /* Menu of the Day can use any saved recipe. The date is retained for
       display/reference only; it must not hide recipes saved on another date. */
    return savedRecipes.slice();
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

    /* IMPORTANT: show ALL saved recipes, not only today's recipes. */
    savedRecipes.slice().sort(function(a,b){
        return String(a.name||"").localeCompare(String(b.name||""));
    }).forEach(function(r){
        if(used.has(String(r.id)))return;
        const option=document.createElement("option");
        option.value=String(r.id);
        option.textContent=String(r.name||"Unnamed Recipe") + (r.date && r.date!==date ? " — saved " + r.date : "");
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
    if(hide&&entry)entry.style.display="none";
    else if(entry)entry.style.display="none";
    if(select)select.value="";

    const cost=document.getElementById("selectedMenuRecipeCost");
    if(cost)cost.textContent=money(0);

    const values={
        menuServings:"1",
        menuSellingPrice:"0",
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
        const date=document.getElementById("menuDate").value;
        const id=String(document.getElementById("menuRecipeSelect").value||"");
        const r=savedRecipes.find(function(x){return String(x.id)===id;});

        if(!date||!r){
            showMessage("menuMessage","Please select a recipe first.","error");
            return false;
        }

        const servings=Math.max(1,numberValue(document.getElementById("menuServings").value));
        let selling=numberValue(document.getElementById("menuSellingPrice").value);
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

        if(menu.items.some(function(x){return String(x.recipeId)===id;})){
            showMessage("menuMessage","This recipe is already in Today's Menu.","error");
            populateMenuRecipeSelect(date);
            renderMenuItems(date);
            return false;
        }

        menu.items.push({
            recipeId:String(r.id),
            recipeName:r.name,
            recipeCost:numberValue(r.totalCost),
            servings:servings,
            suggestedSellingPrice:calculateSuggestedSellingPrice(r.totalCost,servings),
            sellingPrice:selling
        });

        saveAllData();

        /* Render first. Do not let clearing the entry form make it look
           as though the menu item was not saved. */
        renderMenuItems(date);
        populateMenuRecipeSelect(date);
        resetMenuEntry(false);

        showMessage("menuMessage",r.name+" added to Today's Menu.","success");
        return true;
    } catch(error) {
        console.error("saveNewMenuItem error:",error);
        showMessage("menuMessage","Unable to add the menu item. Please check the browser console for the error.","error");
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
        const fc=sales?item.recipeCost/sales*100:0;
        const profit=sales-item.recipeCost;
        const profitPercent=sales?(profit/sales*100):0;
        totalCost+=numberValue(item.recipeCost);
        totalSales+=sales;
        totalProfit+=profit;
        const d=document.createElement("div");
        d.className="menu-item";
        d.dataset.recipeId=String(item.recipeId);
        d.innerHTML='<div class="menu-top"><div><div class="menu-name">'+escapeHtml(item.recipeName)+'</div><div class="menu-cost">Recipe Cost: '+money(item.recipeCost)+'</div></div><div class="menu-field"><label>Servings</label><input type="number" class="menu-quantity" min="1" step="1" value="'+servings+'" oninput="calculateMenuEntry(this)"></div><div class="menu-field"><label>Selling Price</label><input type="number" class="menu-selling-price" min="0" step="0.01" value="'+roundNumber(selling)+'" oninput="calculateMenuEntry(this)"></div></div><div class="menu-info"><div class="menu-info-box"><div class="menu-info-label">Suggested Price / Serving</div><div class="menu-info-value menu-suggested">'+money(suggested)+'</div></div><div class="menu-info-box"><div class="menu-info-label">Actual Food Cost</div><div class="menu-info-value menu-food-cost">'+fc.toFixed(2)+'%</div></div><div class="menu-info-box"><div class="menu-info-label">Profit Margin</div><div class="menu-info-value menu-profit">'+profitPercent.toFixed(2)+'%</div></div></div><div class="small-text" style="margin-top:7px">Sales: <strong class="menu-sales">'+money(sales)+'</strong> | Profit: <strong class="menu-profit-money">'+money(profit)+'</strong></div><div class="menu-actions"><button class="btn btn-primary btn-small" onclick="saveMenuItem(this)">Save / Update</button><button class="btn btn-danger btn-small" onclick="deleteMenuItem(this)">Delete</button></div>';
        c.appendChild(d);
    });
    updateMenuSummary(totalCost,totalSales,totalProfit);
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
    const salesEl=item.querySelector(".menu-sales");
    const profitMoneyEl=item.querySelector(".menu-profit-money");
    if(salesEl)salesEl.textContent=money(sales);
    if(profitMoneyEl)profitMoneyEl.textContent=money(sales-recipe.totalCost);
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
                return String(r.id) === String(recipeId);
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
                return String(existingItem.recipeId) === String(recipeId);
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
    renderMenuItems(date);
    populateMenuRecipeSelect(date);

    showMessage(
        "menuMessage",
        recipe.name + " saved in Menu of the Day.",
        "success"
    );
}


function deleteMenuItem(button){const item=button.closest(".menu-item"),date=document.getElementById("menuDate").value;if(!item)return;const menu=getSavedMenuForDate(date);if(!menu)return;menu.items=menu.items.filter(x=>String(x.recipeId)!==String(item.dataset.recipeId));if(!menu.items.length)savedMenus=savedMenus.filter(x=>x!==menu);saveAllData();populateMenuRecipeSelect(date);renderMenuItems(date);}

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

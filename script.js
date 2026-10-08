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
                '<div class="menu-summary-box menu-serving-input-box"><span>Servings Sold</span><input class="stage4-live-servings" type="number" min="0" step="1" value="'+numberValue(item.servingsSold)+'" inputmode="numeric" autocomplete="off" '+(soldOut?'disabled ':'')+'oninput="updateStage4FoodServings(this)"></div>'+
                stage4Box('Total Sales',money(sales))+
                stage4Box('Profit',money(profit),profit)+
                stage4Box('Profit %',pct.toFixed(2)+'%',profit)+
            '</div>';

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

function editStage4Food(btn){
    const el=btn.closest('.menu-item');
    const date=document.getElementById('menuDate').value||todayString();
    const record=stage4TodayRecord(date);
    if(!el)return;
    const item=record.foodItems.find(function(x){return String(x.id)===String(el.dataset.foodId);});
    if(!item)return;

    el.innerHTML=
        '<div class="menu-top"><div><div class="menu-name">'+escapeHtml(item.recipeName)+'</div></div></div>'+
        '<div class="form-group"><label>Selling Price / Serving</label><input class="stage4-edit-price mobile-large-input" type="number" min="0" step="0.01" value="'+numberValue(item.sellingPrice)+'" inputmode="decimal" autocomplete="off"></div>'+
        '<div class="button-row">'+
            '<button type="button" class="btn btn-primary btn-small" onclick="updateStage4Food(this)">Update</button>'+
            '<button type="button" class="btn btn-secondary btn-small" onclick="loadMenuOfDay()">Cancel</button>'+
        '</div>';
}

function updateStage4FoodServings(input){
    const el=input.closest('.menu-item');
    if(!el)return;
    const date=document.getElementById('menuDate').value||todayString();
    const record=stage4TodayRecord(date);
    const item=record.foodItems.find(function(x){return String(x.id)===String(el.dataset.foodId);});
    if(!item)return;

    item.servingsSold=Math.max(0,Math.floor(numberValue(input.value)));

    const sales=numberValue(item.sellingPrice)*item.servingsSold;
    const profit=sales-numberValue(item.recipeCost);
    const pct=sales?profit/sales*100:0;
    const boxes=el.querySelectorAll('.menu-summary-box');

    if(boxes[3])boxes[3].querySelector('strong').textContent=money(sales);
    if(boxes[4]){
        const strong=boxes[4].querySelector('strong');
        strong.textContent=money(profit);
        strong.classList.remove('profit-positive','profit-negative');
        if(profit>0)strong.classList.add('profit-positive');
        if(profit<0)strong.classList.add('profit-negative');
    }
    if(boxes[5]){
        const strong=boxes[5].querySelector('strong');
        strong.textContent=pct.toFixed(2)+'%';
        strong.classList.remove('profit-positive','profit-negative');
        if(pct>0)strong.classList.add('profit-positive');
        if(pct<0)strong.classList.add('profit-negative');
    }

    calculateCombinedSales(date);
}

function updateStage4Food(btn){
    const el=btn.closest('.menu-item');
    const date=document.getElementById('menuDate').value||todayString();
    const record=stage4TodayRecord(date);
    if(!el)return;
    const item=record.foodItems.find(function(x){return String(x.id)===String(el.dataset.foodId);});
    if(!item)return;

    const p=numberValue(el.querySelector('.stage4-edit-price').value);
    if(p<=0){
        showMessage('menuMessage','Enter a valid Selling Price.','error');
        return;
    }
    item.sellingPrice=p;
    saveAllData();
    loadMenuOfDay();
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

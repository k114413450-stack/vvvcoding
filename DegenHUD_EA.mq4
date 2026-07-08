//+------------------------------------------------------------------+
//|                                                 DegenHUD_EA.mq4  |
//|                                  Copyright 2026, Degen Arena     |
//|                                       https://vvvcoding.com/en/  |
//+------------------------------------------------------------------+
#property copyright "Copyright 2026, Degen Arena"
#property link      "https://vvvcoding.com/en/"
#property version   "1.00"
#property strict

// --- UI Layout Coordinates
#define PANEL_WIDTH   220
#define PANEL_HEIGHT  280
#define PANEL_X       20
#define PANEL_Y       20
#define CORNER        CORNER_RIGHT_UPPER

// --- Global variables
color ThemeBackground = C'0x0A,0x0C,0x10'; // Deep Dark base
color CardBackground  = C'0x12,0x14,0x1A'; // Semi-transparent Card
color ThemeAccent     = C'0xFF,0xB8,0x00'; // Degen Gold
color ThemeUp         = C'0x00,0xE6,0x76'; // Neon Green
color ThemeDown       = C'0xFF,0x3D,0x00'; // Neon Red
color ThemeMuted      = C'0xA0,0xAE,0xC0'; // Cool Grey

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   // 1. Re-theme the MT4 Chart to Cyberpunk Dark Mode
   ChartSetInteger(0, CHART_SHOW_GRID, false);
   ChartSetInteger(0, CHART_SHOW_VOLUMES, false);
   ChartSetInteger(0, CHART_COLOR_BACKGROUND, ThemeBackground);
   ChartSetInteger(0, CHART_COLOR_FOREGROUND, ThemeMuted);
   
   // Candle colors (Correct MQL4 properties)
   ChartSetInteger(0, CHART_COLOR_CHART_UP, ThemeUp);
   ChartSetInteger(0, CHART_COLOR_CHART_DOWN, ThemeDown);
   ChartSetInteger(0, CHART_COLOR_CANDLE_BULL, ThemeUp);
   ChartSetInteger(0, CHART_COLOR_CANDLE_BEAR, ThemeDown);
   
   ChartRedraw();

   // 2. Draw the Interactive HUD Skin Panel
   CreateHUD();

   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   // Clean up all HUD elements from the chart when removed
   ObjectsDeleteAll(0, "DHUD_");
   ChartSetInteger(0, CHART_SHOW_GRID, true); // Restore grid
   ChartRedraw();
}

//+------------------------------------------------------------------+
//| Expert tick function                                             |
//+------------------------------------------------------------------+
void OnTick()
{
   // Dynamically update real-time info like current spread and Account equity
   if(ObjectFind(0, "DHUD_LblEquity") >= 0)
   {
      ObjectSetString(0, "DHUD_LblEquity", OBJPROP_TEXT, "Equity: $" + DoubleToString(AccountEquity(), 2));
   }
   if(ObjectFind(0, "DHUD_LblSpread") >= 0)
   {
      double spread = MarketInfo(Symbol(), MODE_SPREAD) / 10.0; // convert to standard points
      ObjectSetString(0, "DHUD_LblSpread", OBJPROP_TEXT, "Spread: " + DoubleToString(spread, 1) + " pips");
   }
   ChartRedraw();
}

//+------------------------------------------------------------------+
//| Chart Event handler (Interactivity clicks)                       |
//+------------------------------------------------------------------+
void OnChartEvent(const int id,
                  const long &lparam,
                  const double &dparam,
                  const string &sparam)
{
   // Check if a button click triggered on our HUD
   if(id == CHARTEVENT_OBJECT_CLICK)
   {
      if(sparam == "DHUD_BtnBuy")
      {
         Alert("[DEGEN HUD] Executing Market BUY Order (0.1 Lots)...");
         int ticket = OrderSend(Symbol(), OP_BUY, 0.1, Ask, 3, 0, 0, "DegenHUD Buy", 16800, 0, ThemeUp);
         if(ticket < 0) Alert("BUY order failed! Error: ", GetLastError());
         
         // Reset button click state
         ObjectSetInteger(0, "DHUD_BtnBuy", OBJPROP_STATE, false);
      }
      else if(sparam == "DHUD_BtnSell")
      {
         Alert("[DEGEN HUD] Executing Market SELL Order (0.1 Lots)...");
         int ticket = OrderSend(Symbol(), OP_SELL, 0.1, Bid, 3, 0, 0, "DegenHUD Sell", 16800, 0, ThemeDown);
         if(ticket < 0) Alert("SELL order failed! Error: ", GetLastError());
         
         ObjectSetInteger(0, "DHUD_BtnSell", OBJPROP_STATE, false);
      }
      else if(sparam == "DHUD_BtnClose")
      {
         Alert("[DEGEN HUD] Closing all orders for " + Symbol() + "...");
         CloseAllPositions();
         ObjectSetInteger(0, "DHUD_BtnClose", OBJPROP_STATE, false);
      }
      ChartRedraw();
   }
}

//+------------------------------------------------------------------+
//| Create HUD Layout Panel                                          |
//+------------------------------------------------------------------+
void CreateHUD()
{
   // --- 1. Background Panel Container
   CreateRect("DHUD_BgPanel", PANEL_X, PANEL_Y, PANEL_WIDTH, PANEL_HEIGHT, CardBackground, ThemeAccent, 1);

   // --- 2. Title Section
   CreateLabel("DHUD_LblTitle", "⚡ DEGEN ARENA", PANEL_X + 15, PANEL_Y + 15, "Space Grotesk", 11, ThemeAccent);
   CreateLabel("DHUD_LblSubTitle", "M1 Execution Engine", PANEL_X + 15, PANEL_Y + 35, "Arial", 8, ThemeMuted);
   
   // Divider line
   CreateRect("DHUD_Divider", PANEL_X + 15, PANEL_Y + 50, PANEL_WIDTH - 30, 2, ThemeMuted, ThemeMuted, 0);

   // --- 3. Dynamic Stats Info
   CreateLabel("DHUD_LblAcc", "Account: " + IntegerToString(AccountNumber()), PANEL_X + 15, PANEL_Y + 65, "Arial", 8, ThemeMuted);
   CreateLabel("DHUD_LblTrial", "Status: FREE TRIAL active", PANEL_X + 15, PANEL_Y + 83, "Arial", 8, ThemeAccent);
   CreateLabel("DHUD_LblEquity", "Equity: $" + DoubleToString(AccountEquity(), 2), PANEL_X + 15, PANEL_Y + 101, "Arial", 9, C'0xFF,0xFF,0xFF');
   CreateLabel("DHUD_LblSpread", "Spread: ...", PANEL_X + 15, PANEL_Y + 119, "Arial", 9, ThemeMuted);
   
   // --- 4. Interactive Action Buttons
   // BUY button (Modern Styled)
   CreateButton("DHUD_BtnBuy", "BUY MARKET", PANEL_X + 15, PANEL_Y + 145, PANEL_WIDTH - 30, 32, ThemeUp, C'0x0A,0x0C,0x10', "Arial Bold", 9);
   
   // SELL button
   CreateButton("DHUD_BtnSell", "SELL MARKET", PANEL_X + 15, PANEL_Y + 185, PANEL_WIDTH - 30, 32, ThemeDown, C'0x0A,0x0C,0x10', "Arial Bold", 9);
   
   // CLOSE ALL button
   CreateButton("DHUD_BtnClose", "CLOSE ALL POSITIONS", PANEL_X + 15, PANEL_Y + 230, PANEL_WIDTH - 30, 24, C'0x20,0x24,0x2E', ThemeMuted, "Arial", 8);

   ChartRedraw();
}

//+------------------------------------------------------------------+
//| Close all open trade positions for current symbol                |
//+------------------------------------------------------------------+
void CloseAllPositions()
{
   for(int i = OrdersTotal() - 1; i >= 0; i--)
   {
      if(OrderSelect(i, SELECT_BY_POS, MODE_TRADES))
      {
         if(OrderSymbol() == Symbol())
         {
            bool res = false;
            if(OrderType() == OP_BUY)
               res = OrderClose(OrderTicket(), OrderLots(), Bid, 3, ThemeDown);
            else if(OrderType() == OP_SELL)
               res = OrderClose(OrderTicket(), OrderLots(), Ask, 3, ThemeUp);
         }
      }
   }
}

//+------------------------------------------------------------------+
//| UI Helper: Create Rectangle Panel                                |
//+------------------------------------------------------------------+
void CreateRect(string name, int x, int y, int w, int h, color bg_color, color border_color, int border_width)
{
   ObjectCreate(0, name, OBJ_RECTANGLE_LABEL, 0, 0, 0);
   ObjectSetInteger(0, name, OBJPROP_CORNER, CORNER);
   ObjectSetInteger(0, name, OBJPROP_XDISTANCE, x);
   ObjectSetInteger(0, name, OBJPROP_YDISTANCE, y);
   ObjectSetInteger(0, name, OBJPROP_XSIZE, w);
   ObjectSetInteger(0, name, OBJPROP_YSIZE, h);
   ObjectSetInteger(0, name, OBJPROP_BGCOLOR, bg_color);
   ObjectSetInteger(0, name, OBJPROP_BORDER_TYPE, BORDER_FLAT);
   ObjectSetInteger(0, name, OBJPROP_COLOR, border_color);
   ObjectSetInteger(0, name, OBJPROP_WIDTH, border_width);
   ObjectSetInteger(0, name, OBJPROP_BACK, false);
   ObjectSetInteger(0, name, OBJPROP_SELECTABLE, false);
}

//+------------------------------------------------------------------+
//| UI Helper: Create Text Label                                     |
//+------------------------------------------------------------------+
void CreateLabel(string name, string text, int x, int y, string font, int size, color text_color)
{
   ObjectCreate(0, name, OBJ_LABEL, 0, 0, 0);
   ObjectSetInteger(0, name, OBJPROP_CORNER, CORNER);
   ObjectSetInteger(0, name, OBJPROP_XDISTANCE, x);
   ObjectSetInteger(0, name, OBJPROP_YDISTANCE, y);
   ObjectSetString(0, name, OBJPROP_TEXT, text);
   ObjectSetString(0, name, OBJPROP_FONT, font);
   ObjectSetInteger(0, name, OBJPROP_FONTSIZE, size);
   ObjectSetInteger(0, name, OBJPROP_COLOR, text_color);
   ObjectSetInteger(0, name, OBJPROP_SELECTABLE, false);
}

//+------------------------------------------------------------------+
//| UI Helper: Create Button Control                                 |
//+------------------------------------------------------------------+
void CreateButton(string name, string text, int x, int y, int w, int h, color bg_color, color text_color, string font, int size)
{
   ObjectCreate(0, name, OBJ_BUTTON, 0, 0, 0);
   ObjectSetInteger(0, name, OBJPROP_CORNER, CORNER);
   ObjectSetInteger(0, name, OBJPROP_XDISTANCE, x);
   ObjectSetInteger(0, name, OBJPROP_YDISTANCE, y);
   ObjectSetInteger(0, name, OBJPROP_XSIZE, w);
   ObjectSetInteger(0, name, OBJPROP_YSIZE, h);
   ObjectSetString(0, name, OBJPROP_TEXT, text);
   ObjectSetString(0, name, OBJPROP_FONT, font);
   ObjectSetInteger(0, name, OBJPROP_FONTSIZE, size);
   ObjectSetInteger(0, name, OBJPROP_BGCOLOR, bg_color);
   ObjectSetInteger(0, name, OBJPROP_COLOR, text_color);
   ObjectSetInteger(0, name, OBJPROP_SELECTABLE, false);
   ObjectSetInteger(0, name, OBJPROP_STATE, false);
}

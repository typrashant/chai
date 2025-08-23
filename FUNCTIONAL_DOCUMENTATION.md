# Chai App - Functional Documentation

### 1. Overview

**Chai** is a personal financial planning application designed to make smart finance simple for users in the 20-40 age demographic in India. The app provides a comprehensive dashboard to track net worth, manage income and expenses, set financial goals, and gain insights into one's financial health and personality.

### 2. User Onboarding & Authentication

*   **Authentication:** The app uses a phone number-based system for both signing up and signing in. This simplifies the process and removes the need for users to remember passwords.
*   **OTP Verification:** A 4-digit One-Time Password (OTP) is used to verify the user's phone number, ensuring secure access.
*   **Initial Data Collection:** On their first login, new users are guided through two essential onboarding steps:
    1.  **Demographics:** The user provides their age, gender, and the number of dependents. This data is crucial for personalizing financial advice, especially for insurance and goal planning.
    2.  **Persona Quiz:** The user completes a 5-question quiz to determine their financial persona.

### 3. Persona Classification System

The app classifies users into one of six personas to provide tailored insights. This classification is based on a two-dimensional analysis of the user's answers in the onboarding quiz.

*   **Dimension 1: Risk Tolerance:** Measured by questions about investment preferences and reactions to financial gains or losses.
*   **Dimension 2: Financial Discipline:** Measured by questions about budgeting habits and long-term goal planning.

The **Six Personas** are:
1.  **The Guardian (Low Risk, High Discipline):** A meticulous planner who prioritizes capital preservation.
2.  **The Planner (Balanced Risk, High Discipline):** A goal-oriented and methodical individual who follows a well-defined financial plan.
3.  **The Adventurer (High Risk, High Discipline):** A calculated risk-taker who researches high-growth opportunities to maximize returns.
4.  **The Spender (Low Risk, Low Discipline):** Prioritizes their present lifestyle and prefers keeping money accessible.
5.  **The Seeker (Balanced Risk, High Discipline):** Is interested in growth but lacks a concrete strategy and is looking for guidance.
6.  **The Accumulator (High Risk, Low Discipline):** An optimistic, spontaneous investor motivated by potential big wins but may lack a long-term strategy.

### 4. The Dashboard

The main screen of the app is a dashboard composed of several interactive cards.

##### 4.1. Net Worth

*   **Functionality:** Calculates and displays the user's total net worth.
*   **Logic:** `Net Worth = Total Assets - Total Liabilities`.
*   **UI:** Shows a summary card with the final net worth figure. An "Update" button opens a detailed calculator where users can input values for various assets (Stocks, Mutual Funds, PPF, Property, etc.) and liabilities (Home Loan, Car Loan, etc.).

##### 4.2. Income & Expenses

*   **Functionality:** Tracks monthly cash flow and calculates the savings ratio.
*   **Logic:** `Monthly Savings = Total Income - Total Expenses`. `Savings Ratio = (Monthly Savings / Total Income) * 100`.
*   **UI:** The summary card features a donut chart visualizing the allocation of expenses. The legend is sorted to show the largest expense categories first, with their percentage contribution. The center of the chart prominently displays the user's savings ratio. An "Update" button opens a calculator for detailed income and expense entries.

##### 4.3. Investment Allocation

*   **Functionality:** Provides a detailed breakdown of the user's investment portfolio.
*   **Logic:** This card only considers assets marked as investments (e.g., Stocks, Mutual Funds, NPS, PF) and excludes non-investment assets like a primary home or car.
*   **UI:** Features a donut chart showing the allocation across different investment types. The legend, sorted by value, shows the percentage share of each asset. Below the chart, three analytical bars provide deeper insights by categorizing investments into:
    *   **Debt vs. Equity:** To show risk profile.
    *   **Investment Horizon:** (Short, Medium, Long-Term).
    *   **Asset Purpose:** (Growth vs. Savings).

##### 4.4. Financial Health

*   **Functionality:** This card provides an at-a-glance analysis of the user's financial health using key financial ratios. It only appears after the user has entered data in both the Net Worth and Income & Expenses sections.
*   **Logic:** Calculates six critical ratios (e.g., Savings Ratio, Liquidity Ratio, Debt-to-Income Ratio). Each ratio is assigned a Red, Amber, or Green (RAG) status based on predefined healthy, warning, and danger thresholds.
*   **UI:** Displays the six ratios with their calculated value, a brief description, and a color-coded RAG indicator for a quick health check.

##### 4.5. Financial Protection

*   **Functionality:** Assesses the adequacy of the user's insurance coverage.
*   **Logic:** Calculates a coverage "score" for four key areas:
    *   **Life Protection:** Compares current coverage against a target of 10x annual income.
    *   **Health Protection:** Compares against a recommended minimum coverage.
    *   **Car & Property Protection:** Checks for the presence of insurance if the user owns these assets.
*   **UI:** The summary view shows four progress bars with RAG status. The "Update" view allows users to input their current insurance coverage amounts. For car and property, modern toggle switches are used for a simple Yes/No input.

##### 4.6. Financial Goals

*   **Functionality:** Allows users to set, track, and manage their long-term financial goals.
*   **Logic:** Calculates goal coverage ratios by comparing assets allocated to different time horizons (Short, Medium, Long-Term) against the value of goals set for those same horizons.
*   **UI:**
    *   **Summary View:** Displays coverage ratios as progress bars. It also shows the user's top 3 goals by value, with any additional goals in a scrollable list.
    *   **Update View:** Features an interactive timeline from the user's current age to 100. Users can click on an age to add a goal, choosing from predefined categories (House, Education, etc.) or a custom one. All existing goals are listed in a table for easy management.
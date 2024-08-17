import java.awt.Font;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;

import javax.swing.BorderFactory;
import javax.swing.BoxLayout;
import javax.swing.JApplet;
import javax.swing.JButton;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JOptionPane;
import javax.swing.JPanel;
import javax.swing.JScrollBar;
import javax.swing.JScrollPane;
import javax.swing.JTextField;
import javax.swing.border.Border;
import javax.swing.border.TitledBorder;

public class ExpenseTracker extends JFrame implements ActionListener{
    public JPanel Logs;
    
    public JLabel TotalBudgetText, GroupText1, GroupText2, GroupText3, TotalAmountDisplayed, WantsDiplayed, NeedsDisplayed, SavingsDiplayed, TotalLeftDiplayed;
    
    public int AmountSpent = 0; // number that will display total amount person spends

    public int WantsSpent = 0;

    public  int NeedsSpent = 0;

    public  int SavingSpent = 0;

    public double budget = 0;

    public String SelectedCategory;

    public  int amount;

    // create a fonts
    Font Tittle = new Font("Serif", Font.BOLD, 40);
    Font Budget = new Font("Serif", Font.BOLD, 18);
    Font Editor = new Font("Serif", Font.PLAIN, 15);
    Font ExpenseText = new Font("Serif", Font.BOLD, 20);
    Font CatTittle = new Font("Serif", Font.BOLD, 16);

    public ExpenseTracker() {
        super("Personal Expense Tracker");
        setDefaultCloseOperation(EXIT_ON_CLOSE);
        setPreferredSize(Values.guiSize);
        pack();
        setLocationRelativeTo(null);
        setResizable(true);
        setLayout(null);

        GroupedCategoriesText(); // needs to be diplayed above these JPanels
        UserInputAmounts();
        GUILayout();
    }

    private void GUILayout() {
        // banner label
        JLabel BannerText = new JLabel("Personal Expense Tracker");
        BannerText.setBounds(Values.guiSize.width - Values.BannerSize.width, 15, Values.BannerSize.width, Values.BannerSize.height);
        BannerText.setFont(Tittle);

        // add a JPanel that will set for users budget
        JPanel userBudget = new JPanel();
        userBudget.setLayout(null);
        userBudget.setBounds(Values.guiSize.width - 475, 80, Values.BannerSize.width - 130, 70);
        TitledBorder Total = BorderFactory.createTitledBorder("Total Budget");
        Total.setTitleFont(CatTittle); 
        userBudget.setBorder(Total);

        // Total Budget being Displayed
        TotalBudgetText = new JLabel();
        TotalBudgetText.setBounds(40, 20, 300, 40);
        TotalBudgetText.setFont(Budget);
        TotalBudgetText.setHorizontalAlignment(JTextField.CENTER);
        userBudget.add(TotalBudgetText);

        // add the 3 categories underneath the budget
        String categories[] = {"Needs", "Wants", "Savings"};

        for (int i = 0; i < categories.length; i++) {
            JPanel eachCategory = new JPanel();
            eachCategory.setLayout(null);

            eachCategory.setBounds((Values.guiSize.width - 500) + (i * 150), 160, Values.Grouptable.width, Values.Grouptable.height);
            TitledBorder Grouped = BorderFactory.createTitledBorder("<html>Recommended<br>" + categories[i] + "</html>");
            Grouped.setTitleFont(CatTittle);
            eachCategory.setBorder(Grouped);

            add(eachCategory);
        } // end of for loop


        // add a add expense button on the bottom
        JButton addExpense = new JButton("Add Expense");
        addExpense.setFont(ExpenseText);
        addExpense.setBounds(0, Values.guiSize.height - 90, Values.guiSize.width, 60);
        addExpense.addActionListener(this);

        // add a button to edit the total budget a user wants
        JButton editBudget = new JButton("<html>Edit<br>Budget</html>");
        editBudget.setFont(Editor);
        editBudget.setBounds(500, 100, 70, 40);
        editBudget.setActionCommand("Edit Budget");
        editBudget.addActionListener(this);


        // tittle for Log Panel
        JLabel logTittle = new JLabel("Personal Logs");
        logTittle.setLayout(null);
        logTittle.setFont(CatTittle);
        logTittle.setBounds(Values.guiSize.width - 590, Values.GroupHieght + 40, Values.GroupBanner.width, Values.GroupBanner.height);
        add(logTittle);


        // create a panel for all transactions to be shown
        Logs = new JPanel();
        Logs.setLayout(new BoxLayout(Logs, BoxLayout.Y_AXIS));

        // integrate scrolling through user logs
        JScrollPane scrollPane = new JScrollPane(Logs);
        scrollPane.setBounds(Values.guiSize.width - 590, Values.GroupHieght + 70, Values.LogSize.width, Values.LogSize.height);
        scrollPane.setBorder(BorderFactory.createLoweredBevelBorder());
        scrollPane.setMaximumSize(Values.LogSize);
        scrollPane.setVerticalScrollBarPolicy(JScrollPane.VERTICAL_SCROLLBAR_AS_NEEDED);
        scrollPane.setHorizontalScrollBarPolicy(JScrollPane.HORIZONTAL_SCROLLBAR_NEVER);

        JScrollBar ScrollSpeed = new JScrollBar();
        ScrollSpeed.setUnitIncrement(20);


        // Diplay each thing
        add(BannerText);
        add(userBudget);
        add(addExpense);
        add(editBudget);   
        add(scrollPane);    
    }
    // create method to diplay a recommended amount a user should use
    private void GroupedCategoriesText() {
        GroupText1 = new JLabel();
        GroupText1.setFont(Budget);
        GroupText1.setBounds(Values.guiSize.width - 470, Values.GroupHieght, Values.GroupBanner.width, Values.GroupBanner.height);
        
        GroupText2 = new JLabel();
        GroupText2.setFont(Budget);
        GroupText2.setBounds(Values.guiSize.width - 320, Values.GroupHieght, Values.GroupBanner.width, Values.GroupBanner.height);

        GroupText3 = new JLabel();
        GroupText3.setFont(Budget);
        GroupText3.setBounds(Values.guiSize.width - 170, Values.GroupHieght, Values.GroupBanner.width, Values.GroupBanner.height);

        add(GroupText1);
        add(GroupText2);
        add(GroupText3);
    }

    private void UserInputAmounts() {
        // Amounts that user inputed added up
        JPanel TotalAmount = new JPanel();
        TotalAmount.setLayout(null);
        TotalAmount.setBounds(Values.guiSize.width - 150, Values.InputHeight + 60, 120, 70);
        TitledBorder Amount = BorderFactory.createTitledBorder("Total Spent");
        Amount.setTitleFont(CatTittle); 
        TotalAmount.setBorder(Amount);
        
        TotalAmountDisplayed = new JLabel();
        TotalAmountDisplayed.setBounds(0, 20, 120, 40);
        TotalAmountDisplayed.setFont(Budget);
        TotalAmountDisplayed.setHorizontalAlignment(JTextField.CENTER);
        TotalAmountDisplayed.setText("$0");
        TotalAmount.add(TotalAmountDisplayed);

        // Amount to display how much they spend for each category
        JPanel NeedsAmounts = new JPanel();
        NeedsAmounts.setLayout(null);
        NeedsAmounts.setBounds(Values.guiSize.width - 150, Values.InputHeight + 140, 120, 70);
        Amount = BorderFactory.createTitledBorder("Needs Spend");
        Amount.setTitleFont(CatTittle);
        NeedsAmounts.setBorder(Amount);

        NeedsDisplayed = new JLabel();
        NeedsDisplayed.setBounds(0, 20, 120, 40);
        NeedsDisplayed.setFont(Budget);
        NeedsDisplayed.setHorizontalAlignment(JTextField.CENTER);
        NeedsDisplayed.setText("$0");
        NeedsAmounts.add(NeedsDisplayed);

        JPanel WantsAmounts=  new JPanel();
        WantsAmounts.setLayout(null);
        WantsAmounts.setBounds(Values.guiSize.width - 150, Values.InputHeight + 220, 120, 70);
        Amount = BorderFactory.createTitledBorder("Wants Spent");
        Amount.setTitleFont(CatTittle);
        WantsAmounts.setBorder(Amount);

        WantsDiplayed = new JLabel();
        WantsDiplayed.setBounds(0, 20, 120, 40);
        WantsDiplayed.setFont(Budget);
        WantsDiplayed.setHorizontalAlignment(JTextField.CENTER);
        WantsDiplayed.setText("$0");
        WantsAmounts.add(WantsDiplayed);

        JPanel SavingsAmounts = new JPanel();
        SavingsAmounts.setLayout(null);
        SavingsAmounts.setBounds(Values.guiSize.width - 150, Values.InputHeight + 300, 120, 70);
        Amount = BorderFactory.createTitledBorder("Savings Spent");
        Amount.setTitleFont(CatTittle);
        SavingsAmounts.setBorder(Amount);

        SavingsDiplayed = new JLabel();
        SavingsDiplayed.setBounds(0, 20, 120, 40);
        SavingsDiplayed.setFont(Budget);
        SavingsDiplayed.setHorizontalAlignment(JTextField.CENTER);
        SavingsDiplayed.setText("$0");
        SavingsAmounts.add(SavingsDiplayed);

        JPanel TotalLeft = new JPanel();
        TotalLeft.setLayout(null);
        TotalLeft.setBounds(Values.guiSize.width - 150, Values.InputHeight + 380, 120, 70);
        Amount = BorderFactory.createTitledBorder("Total Left");
        Amount.setTitleFont(CatTittle);
        TotalLeft.setBorder(Amount);

        TotalLeftDiplayed = new JLabel();
        TotalLeftDiplayed.setBounds(0, 20, 120, 40);
        TotalLeftDiplayed.setFont(Budget);
        TotalLeftDiplayed.setHorizontalAlignment(JTextField.CENTER);
        TotalLeftDiplayed.setText("$0");
        TotalLeft.add(TotalLeftDiplayed);

        add(TotalAmount);
        add(WantsAmounts);
        add(NeedsAmounts);
        add(SavingsAmounts);
        add(TotalLeft);
    }

    @Override
    public void actionPerformed(ActionEvent e) {

        String Command = e.getActionCommand();
        
        // check to see if user inputs a number
        if (Command.equalsIgnoreCase("Edit Budget")) {
            boolean validInput = false;
                
            // while loop to keep on prompting question until user puts in number
            while (!validInput) {
                String userInput = JOptionPane.showInputDialog(getParent(), "Enter your total budget:");
                
                // check if its not empty and if what user entered only contains digits
                if (userInput != null && userInput.matches("\\d+")) {
                    budget = Integer.parseInt(userInput);
                    TotalBudgetText.setText("$" + budget);
                    
                    // calculate recommended amount people should use based on category
                    double Needs = budget * 0.50;
                    double Wants = budget * 0.30;
                    double Savings = budget - Wants - Needs;

                    // change the text to be diplayed
                    GroupText1.setText("$" + Needs);
                    GroupText2.setText("$" + Wants);
                    GroupText3.setText("$" + Savings);


                    validInput = true; // end while loop
                } else if (userInput != null) {
                    JOptionPane.showMessageDialog(getParent(),
                            "Please enter a valid number.", "Invalid Input", JOptionPane.ERROR_MESSAGE);
                } else {
                    // User clicked cancel or closed dialog
                    validInput = true; // Exit loop
                }

    
                // change amount person will be able to spend
                budget -= AmountSpent;
                TotalLeftDiplayed.setText("$" + budget);
            }
        }
        if (Command.equalsIgnoreCase("Add Expense")) { 
            // TODO to choose whether they spent or income
            // String[] TypeofExpense = new String[2];
            // TypeofExpense[0] = "Income";
            // TypeofExpense[1] = "Spent";

            // Object SelectedOption = JOptionPane.showInputDialog(null, "Choose the expense", "Selection", JOptionPane.QUESTION_MESSAGE, null, TypeofExpense, "Spent");

            amount = 0; // to display through JLabel in the LogPanel
            
            boolean ValidInput = false;

            while (!ValidInput) {
                String AmountofExpense = JOptionPane.showInputDialog(getParent(), "Enter Amount you Spent");
                
            if (AmountofExpense != null && AmountofExpense.matches("\\d+")) {
                amount = Integer.parseInt(AmountofExpense);
                ValidInput = true;
            }
            else if (AmountofExpense != null) {
                JOptionPane.showMessageDialog(getParent(),
                "Please enter a valid number.", "Invalid Input", JOptionPane.ERROR_MESSAGE);
            }
            else {
                ValidInput = true;
            }
        }


            // whether its needs wants or savings
            String[] CategoryofExpense = new String[3];
            CategoryofExpense[0] = "Needs";
            CategoryofExpense[1] = "Wants";
            CategoryofExpense[2] = "Savings";

            Object CategorySelected = JOptionPane.showInputDialog(null, "Choose the Category", "Selection", JOptionPane.QUESTION_MESSAGE, null, CategoryofExpense, "Spent");

            SelectedCategory = (String) CategorySelected; // convert object into string

            if (SelectedCategory.equalsIgnoreCase("needs")) {
                NeedsSpent += amount;
                NeedsDisplayed.setText("$" + NeedsSpent);
            }
            else if (SelectedCategory.equalsIgnoreCase("wants")) {
                WantsSpent += amount;
                WantsDiplayed.setText("$" + WantsSpent);
            }
            else if (SelectedCategory.equalsIgnoreCase("savings")) {
                SavingSpent += amount;
                SavingsDiplayed.setText("$" + SavingSpent);
            }

            // diplay all amounts in the bottom right
            AmountSpent += amount;
            TotalAmountDisplayed.setText("$" + AmountSpent);

            budget -= amount;
            TotalLeftDiplayed.setText("$" + budget);

            // the reason they spent it
            String DescriptionExpense = JOptionPane.showInputDialog(getParent(), "Description");
            
            // create task component
            UserLogs taskComponent = new UserLogs(Logs, this, amount, SelectedCategory, DescriptionExpense);

            Logs.add(taskComponent);
            Logs.repaint();
            Logs.revalidate();

                }
                repaint();
                invalidate();
        }

        // Method to reverse an expense when user presses delete
        public void reverseExpense(int amount, String category) {
            // Add the amount back to the total budget
            budget += amount;
            TotalLeftDiplayed.setText("$" + budget);

            // Add the amount back to the specific category
            if (category.equalsIgnoreCase("needs")) {
                NeedsSpent -= amount;
                NeedsDisplayed.setText("$" + NeedsSpent);
            } 
            else if (category.equalsIgnoreCase("wants")) {
                WantsSpent -= amount;
                WantsDiplayed.setText("$" + WantsSpent);
            } 
            else if (category.equalsIgnoreCase("savings")) {
                SavingSpent -= amount;
                SavingsDiplayed.setText("$" + SavingSpent);
            }

        // minus the total spent
        AmountSpent -= amount;
        TotalAmountDisplayed.setText("$" + AmountSpent);
    }
    }  

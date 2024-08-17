import java.awt.Color;
import java.awt.Cursor;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import javax.swing.BorderFactory;
import javax.swing.JButton;
import javax.swing.JLabel;
import javax.swing.JPanel;
import javax.swing.SwingConstants;


public class UserLogs extends JPanel implements ActionListener{
        private JLabel taskFieldAmount, TaskFieldCategory, TaskFieldDescription;
        private JButton deleteButton;
        private ExpenseTracker Tracker;
        private int Amount;
        private String Category;
        private String Description;

        // this panel is used so that we can make updates to the task component panel when the task are deleted
        private JPanel parentPanel;
        public int setBackground;


        public UserLogs(JPanel parentPanel, ExpenseTracker Tracker, int Amount, String Category, String Description) {
            this.parentPanel = parentPanel;
            this.Tracker = Tracker;
            this.Amount = Amount;
            this.Category = Category;
            this.Description = Description;


        // task field that displays amount user puts in
        taskFieldAmount = new JLabel();
        taskFieldAmount.setBorder(BorderFactory.createLineBorder(Color.black));
        taskFieldAmount.setText("$" + Amount);
        taskFieldAmount.setHorizontalAlignment(SwingConstants.CENTER);
        taskFieldAmount.setPreferredSize(Values.AmountSize);

        // task field that displays if its needs, wants, or savings
        TaskFieldCategory = new JLabel();
        TaskFieldCategory.setBorder(BorderFactory.createLineBorder(Color.black));
        TaskFieldCategory.setText(Category);
        TaskFieldCategory.setHorizontalAlignment(SwingConstants.CENTER);
        TaskFieldCategory.setPreferredSize(Values.CategorySelectedSize);

        // taskfield that displays what the purchase is for
        TaskFieldDescription = new JLabel();
        TaskFieldDescription.setBorder(BorderFactory.createLineBorder(Color.black));
        TaskFieldDescription.setText(Description);
        TaskFieldDescription.setHorizontalAlignment(SwingConstants.CENTER);
        TaskFieldDescription.setPreferredSize(Values.DescriptionSize);

        // add a delete button
        deleteButton = new JButton("x");
        deleteButton.setPreferredSize(Values.DeleteButtonSize);
        deleteButton.setCursor(Cursor.getPredefinedCursor(Cursor.HAND_CURSOR));
        deleteButton.addActionListener(this);

        // add to this task component
        add(taskFieldAmount);
        add(TaskFieldCategory);
        add(TaskFieldDescription);
        add(deleteButton);

    }

        @Override
        public void actionPerformed(ActionEvent e) {
            if (e.getActionCommand().equalsIgnoreCase("x")) {
                Tracker.reverseExpense(Amount, Category);

                parentPanel.remove(this);
                parentPanel.repaint();
                parentPanel.revalidate();
            } 
        }
    }

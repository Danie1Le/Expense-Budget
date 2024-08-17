import java.awt.Dimension;

public class Values {
    public static final Dimension guiSize = new Dimension(600, 800); // frame size

    public static final Dimension BannerSize = new Dimension(500, 50); // tittle size

    public static final Dimension LogSize = new Dimension((int) (guiSize.width * 0.70), (int) (guiSize.height * 0.50)); // user log size
    
    public static final Dimension GroupBanner = new Dimension(100, 30); // Log Panel

    public static final Dimension Grouptable = new Dimension(120, 90); // categories

    public static final Dimension AmountSize = new Dimension((int) (LogSize.width * 0.26), 50); // size box inside of Log Panel for amount
    public static final Dimension CategorySelectedSize = new Dimension((int) (LogSize.width * 0.15), 50); // size box inside of Log Panel for category
    public static final Dimension DescriptionSize = new Dimension((int) (LogSize.width * 0.40), 50); // size box inside of Log Panel for reason

    public static final Dimension DeleteButtonSize = new Dimension((int) (LogSize.width * 0.10), 50);

    public static final int GroupHieght = 210;

    public static final int InputHeight = 220;

}

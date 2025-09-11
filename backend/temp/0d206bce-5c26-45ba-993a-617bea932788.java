// Reads all input from STDIN, trims it, and prints something.
// Edit solve to implement the required logic.
import java.util.*;
public class Main {
    static String solve(String input) {
        // TODO: implement
        return input; // echo
    }
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        sc.useDelimiter("\\Z");
        String data = sc.hasNext() ? sc.next() : "";
        data = data.trim();
        String out = solve(data);
        if (out != null) System.out.println(out);
    }
}
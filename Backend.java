import java.util.List;
public class Backend {
    private List<String> data;

    public Backend(List<String> data) {
        this.data = data;
    }

    }

    public List<String> getData() {
        return data;
    }

    public void setData(List<String> data) {
        this.data = data;
    }

    public String processData() {
        // Simulate data processing
        StringBuilder processed = new StringBuilder();
        for (String item : data) {
            processed.append(item.toUpperCase()).append(" ");
        }
        return processed.toString().trim();
    }

    public void addData(String item) {
        data.add(item);
    }

    public void removeData(String item) {
        data.remove(item);
    }

    public int getDataCount() {
        return data.size();
    }

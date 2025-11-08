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

    public void clearData() {
        data.clear();
    }

    public boolean containsData(String item) {
        return data.contains(item);
    }

    public void printData() {
        for (String item : data) {
            System.out.println(item);
        }
    }

    public String getDataAt(int index) {
        if (index >= 0 && index < data.size()) {
            return data.get(index);
        }
        return null;
    }

    public void updateDataAt(int index, String newItem) {
        if (index >= 0 && index < data.size()) {
            data.set(index, newItem);
        }
    }

    public boolean isEmpty() {
        return data.isEmpty();
    }

    public void sortData() {
        data.sort(String::compareTo);
    }

    public String joinData(String delimiter) {
        return String.join(delimiter, data);
    }

    public List<String> filterData(String keyword) {
        return data.stream()
                   .filter(item -> item.contains(keyword))
                   .toList();
    }

    public void reverseData() {
        java.util.Collections.reverse(data);
    }

    public List<String> getDataSnapshot() {
        return List.copyOf(data);
    }

    public static void main(String[] args) {
        // Example usage
        Backend backend = new Backend(new java.util.ArrayList<>());
        backend.addData("apple");
        backend.addData("banana");
        backend.addData("cherry");
        backend.printData();
        System.out.println("Processed Data: " + backend.processData());
        backend.clearData();
        backend.printData();
        System.out.println("Data Count: " + backend.getDataCount());
        System.out.println("Contains 'banana': " + backend.containsData("banana"));
        backend.printData();
        
    }

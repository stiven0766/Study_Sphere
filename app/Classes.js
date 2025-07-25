import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  TextInput,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import TopSidebar from "../components/TopSidebar";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../config";

const ClassesScreen = () => {
  const router = useRouter();
  const [selectedClass, setSelectedClass] = useState(null);
  const [homeworkList, setHomeworkList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [newHomework, setNewHomework] = useState("");
  const [classes, setClasses] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [messageModalVisible, setMessageModalVisible] = useState(false);
  const [userId, setUserId] = useState(null);
  const [userSubject, setUserSubject] = useState("");

  useEffect(() => {
    const fetchUserId = async () => {
      const user = await AsyncStorage.getItem("user");
      const parsed = JSON.parse(user);
      setUserId(parsed.id);
      setUserSubject(parsed.subject);
    };
    fetchUserId();
  }, []);

  useEffect(() => {
  const fetchTeacherClasses = async () => {
    const user = await AsyncStorage.getItem("user");
    const parsed = JSON.parse(user);
    const token = await AsyncStorage.getItem("token");

    const res = await fetch(`${API_BASE_URL}/api/attendance/teacher-classes/${parsed.id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    // הפוך כל שם כיתה לאובייקט עם id ו-name
    const mapped = data.map((className, index) => ({
      id: (index + 1).toString(),
      name: className,
      subjects: [], // ניתן להוסיף בהמשך
    }));

    setClasses(mapped);
  };

  fetchTeacherClasses();
}, []);

  const handleClassSelect = (classObj) => {
    setSelectedClass(classObj);
    setHomeworkList([]);
  };

const addHomework = async () => {
  if (!newHomework.trim()) return;

  try {
    const token = await AsyncStorage.getItem("token");

    const res = await fetch(`${API_BASE_URL}/api/class/homework/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        classId: selectedClass.name,
        teacherId: userId,
        subject: "שיעורי בית",
        content: newHomework,
      }),
    });

    const data = await res.json();

    if (res.ok) {
      Alert.alert("✅ הצלחה", "שיעורי הבית נשלחו להורים");
      setHomeworkList([...homeworkList, { id: Date.now().toString(), text: newHomework, completed: false }]);
      setNewHomework("");
    } else {
      Alert.alert("❌ שגיאה", data.message || "שליחה נכשלה");
    }
  } catch (error) {
    Alert.alert("❌ שגיאה", error.message);
  }
};


  const sendMessage = async () => {
    if (!messageText.trim()) {
      Alert.alert("שגיאה", "לא ניתן לשלוח הודעה ריקה.");
      return;
    }

    try {
      const token = await AsyncStorage.getItem("token");

      const res = await fetch(`${API_BASE_URL}/api/communication/send-class-message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          classId: selectedClass.name, // לפי מה שאתה שולף ב־Frontend
          senderId: userId,
          content: messageText,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        Alert.alert("✅ הודעה נשלחה", "ההודעה נשלחה לכל ההורים בכיתה");
        setMessageText("");
        setMessageModalVisible(false);
      } else {
        Alert.alert("❌ שגיאה", data.message || "שליחה נכשלה");
      }
    } catch (error) {
      Alert.alert("❌ שגיאה", error.message);
    }
  };

  return (
    <View style={styles.container}>

      {/* top and side bar */}
      <TopSidebar userRole="teacher" />

      <Text style={styles.title}>בחר כיתה</Text>

      <TextInput
        style={styles.searchInput}
        placeholder="🔍 חפש כיתה..."
        placeholderTextColor="black"
        textAlign="right"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <FlatList
        data={classes}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.classCard} onPress={() => handleClassSelect(item)}>
            <Text style={styles.className}>{item.name}</Text>
          </TouchableOpacity>
        )}
      />

      {selectedClass && (
        <>
          <Text style={styles.title}>שיעורי בית לכיתה {selectedClass.name}</Text>
          <TextInput
            style={styles.homeworkInput}
            placeholder="📚 הוסף שיעורי בית..."
            placeholderTextColor="black"
            textAlign="right"
            value={newHomework}
            onChangeText={setNewHomework}
          />
          <TouchableOpacity style={styles.addButton} onPress={addHomework}>
            <Text style={styles.addButtonText}>➕ הוספת שיעורי בית</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.messageButton} onPress={() => setMessageModalVisible(true)}>
            <Text style={styles.messageButtonText}>📢 שליחת הודעה</Text>
          </TouchableOpacity>
        </>
      )}

      <Modal visible={messageModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>📩 שליחת הודעה לכיתה {selectedClass?.name}</Text>
            <TextInput
              style={styles.messageInput}
              placeholder="💬 הקלד הודעה לכיתה..."
              placeholderTextColor="black"
              value={messageText}
              onChangeText={setMessageText}
              multiline
              textAlign="right"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
                <Text style={styles.sendButtonText}>📨 שלח</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setMessageModalVisible(false)}>
                <Text style={styles.cancelButtonText}>❌ בטל</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// 🎨 **עיצוב הדף**
const styles = StyleSheet.create({
  // 🔹 Main container for the entire screen
  container: { 
    flex: 1, 
    paddingTop: 85, 
    backgroundColor: "#F4F4F4", 
    
  },

  // 🔹 Top navigation bar
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: "black",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingTop: 30,
  },

  // 🔹 Sidebar styling (left-side menu)
  sidebarHeader: {
    flexDirection: "row", 
    justifyContent: "space-between", // Space between user name and close button
    alignItems: "center",
    width: "100%",
    paddingBottom: 10,
    borderBottomWidth: 1, 
    borderBottomColor: "#fff", 
    paddingHorizontal: 5, // Padding from the sides
  },
  menuButton: { 
    padding: 4 
  },
  menuIcon: { 
    color: "white", 
    fontSize: 26 
  },
  dateTime: { 
    color: "white", 
    fontSize: 16, 
    fontWeight: "bold" 
  },

  // 🔹 Modal background styling for popups
  modalBackground: { 
    flex: 1, 
    backgroundColor: "rgba(0,0,0,0.5)" 
  },

  // 🔹 Sidebar (Menu on the left)
  sidebar: { 
    position: "absolute", 
    left: 0, 
    width: 250, 
    height: "100%", 
    backgroundColor: "black", 
    padding: 50 
  },
  sidebarUser: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 15, 
  },
  closeButton: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
  },
  sidebarItem: { 
    paddingVertical: 15 
  },
  sidebarText: { 
    color: "white", 
    fontSize: 18 
  },

  // 🔹 Class selection section
  title: { 
    fontSize: 22, 
    fontWeight: "bold", 
    marginVertical: 10 ,
    textAlign:"center",
  },
  searchInput: { 
    padding: 10, 
    borderWidth: 1, 
    borderRadius: 5, 
    marginBottom: 10 
  },
  classCard: { 
    flex: 1, 
    margin: 5, 
    padding: 20, 
    backgroundColor: "lightblue", 
    alignItems: "center", 
    borderRadius: 10 
  },
  className: { 
    fontSize: 18, 
    fontWeight: "bold" 
  },

  // 🔹 Homework input and list
  homeworkInput: { 
    padding: 10, 
    borderWidth: 1, 
    borderRadius: 5, 
    marginBottom: 10 
    
  },
  addButton: { 
    backgroundColor: "black",
    padding: 15,
    borderRadius: 5,
    marginTop: 15,
    
  },
  addButtonText: { 
    color: "white", 
    textAlign: "center", 
    fontSize: 16,
    fontWeight: "bold" 
  },

  // ✅ Send Message Button
  messageButton: {
    backgroundColor: "black",
    padding: 15,
    borderRadius: 5,
    marginTop: 15,
  },
  messageButtonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 16,
  },

  // ✅ Modal Styles
  modalContainer: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center", 
    backgroundColor: "rgba(0,0,0,0.5)" 
  },
  modalContent: { 
    width: "90%", 
    height: 250,
    borderWidth: 1, 
    backgroundColor: "rgb(255, 255, 255)", 
    padding: 20, 
    borderRadius: 10 ,
    
  },
  modalTitle: { 
    fontSize: 18, 
    fontWeight: "bold", 
    marginBottom: 10, 
    textAlign: "center", 
    margin:5
  },
  
  messageInput: { 
    height: 100, 
    borderWidth: 1, 
    borderColor: "#ddd", 
    padding: 10, 
    borderRadius: 5, 
    marginBottom: 10, 
    textAlignVertical: "top", 
    backgroundColor: "#fff", // ✅ Ensures good contrast
    color: "black", // ✅ Ensures user-typed text is black
  },
  
  modalButtons: { 
    flexDirection: "row", 
    justifyContent: "space-between" 
  },
  classInput: { 
    height: 50, 
    borderWidth: 2, // Make border more visible
    borderColor: "rgba(99, 98, 98, 0.77)", // Blue border to highlight input field
    backgroundColor: "#F8F9FA", // Light gray background for visibility
    padding: 5, 
    borderRadius: 8, // Round the corners
    marginBottom: 10, 
    width: "100%", 
    textAlign: "right", // Aligns text for Hebrew input
    fontSize: 16, // Make text more readable
    color: "#333" // Dark text for contrast
  },
  

  // ✅ Buttons inside the modal (Send & Cancel)
  sendButton: { 
    backgroundColor: "green", 
    padding: 10, 
    borderRadius: 5, 
    flex: 1, 
    marginRight: 5 
  },
  sendButtonText: { 
    color: "white", 
    textAlign: "center", 
    fontWeight: "bold" 
  },
  cancelButton: { 
    backgroundColor: "rgb(255, 0, 0)", 
    padding: 10, 
    borderRadius: 5, 
    flex: 1, 
    marginLeft: 5 
  },
  cancelButtonText: { 
    color: "white", 
    textAlign: "center", 
    fontWeight: "bold" 
  },
});




export default ClassesScreen;
